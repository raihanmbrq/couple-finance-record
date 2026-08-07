import { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Input, Select } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { ASSET_CATEGORIES, type Goal } from '@/lib/types';
import { formatMoney, formatMoneyInput, parseMoneyInput, formatDateShort } from '@/lib/format';
import { getCurrencySymbol } from '@/lib/currencies';
import { calculateMonthlyContribution, durationLabel, monthsBetween } from '@/lib/goalMath';
import { PiggyBank, Plus, Trash2, Wallet, Pencil } from 'lucide-react';

function SummaryRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-primary' : 'text-text-primary'}`}>{value}</span>
    </div>
  );
}

export function GoalsSection() {
  const { goals, wallets, saveGoal, deleteGoal, depositToGoal, profile } = useApp();
  const currency = profile?.currency ?? 'IDR';
  const { showToast } = useToast();

  // Create / Edit form
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<Goal['asset_category']>('Tabungan Biasa');
  const [returnRate, setReturnRate] = useState('5');
  const [saving, setSaving] = useState(false);
  const [deleteGoalTarget, setDeleteGoalTarget] = useState<Goal | null>(null);

  // Deposit
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositWallet, setDepositWallet] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  const isInvestment = ASSET_CATEGORIES.find(c => c.key === category)?.isInvestment ?? false;
  const rate = isInvestment ? (parseFloat(returnRate.replace(',', '.')) || 0) : 0;
  const amount = parseMoneyInput(targetAmount);
  const months = useMemo(() => {
    if (!targetDate) return 0;
    return monthsBetween(new Date(), new Date(targetDate));
  }, [targetDate]);

  const pmt = calculateMonthlyContribution({
    targetAmount: amount,
    currentAmount: editing?.current_amount ?? 0,
    months,
    annualReturnPct: rate,
  });
  const pmt0 = calculateMonthlyContribution({
    targetAmount: amount,
    currentAmount: editing?.current_amount ?? 0,
    months,
    annualReturnPct: 0,
  });
  const categoryLabel = ASSET_CATEGORIES.find(c => c.key === category)?.label ?? category;

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setTargetAmount('');
    setTargetDate('');
    setCategory('Tabungan Biasa');
    setReturnRate('5');
    setShowForm(true);
  };

  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setTitle(goal.title);
    setTargetAmount(formatMoneyInput(goal.target_amount, currency));
    setTargetDate(goal.target_date.slice(0, 10));
    setCategory(goal.asset_category);
    setReturnRate(goal.expected_return_rate ? String(goal.expected_return_rate) : '5');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !amount || !targetDate) return;
    setSaving(true);
    try {
      await saveGoal({
        ...(editing ? { id: editing.id } : { current_amount: 0 }),
        title: title.trim(),
        target_amount: amount,
        target_date: new Date(`${targetDate}T23:59:59`).toISOString(),
        asset_category: category,
        expected_return_rate: rate,
        monthly_contribution: pmt,
      });
      showToast(editing ? 'Goal berhasil diperbarui' : 'Goal berhasil dibuat');
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteGoalTarget) return;
    try {
      await deleteGoal(deleteGoalTarget.id);
      setDeleteGoalTarget(null);
      showToast('Goal berhasil dihapus', 'error');
    } catch {
      showToast('Gagal menghapus goal');
    }
  };

  const handleDeposit = async () => {
    const goal = depositGoal;
    if (!goal || !depositWallet) return;
    const amt = parseMoneyInput(depositAmount);
    if (!amt) return;
    setDepositing(true);
    try {
      await depositToGoal(goal.id, depositWallet, amt);
      showToast('Deposit berhasil ditambahkan');
      setDepositGoal(null);
      setDepositWallet('');
      setDepositAmount('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Deposit gagal');
    } finally {
      setDepositing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-extrabold text-2xl text-text-primary">Set Goals</h2>
        <button
          onClick={openCreate}
          className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-card hover:bg-primary-hover active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <PiggyBank className="w-4 h-4 text-primary shrink-0" />
        <p className="text-xs text-text-secondary">
          Sinking fund untuk rencana besar — tabung rutin setiap bulan hingga target tercapai.
        </p>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={<PiggyBank className="w-7 h-7" />}
          title="Belum ada tujuan keuangan"
          description="Buat goal seperti 'Beli Mobil' atau 'Dana Darurat', lalu deposit dana dari wallet."
          action={<Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 inline mr-1" />
            Buat Tujuan
          </Button>}
        />
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const pct = goal.target_amount > 0 ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0;
            return (
              <Card key={goal.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <PiggyBank className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-text-primary truncate">{goal.title}</p>
                      <p className="text-xs text-text-secondary">
                        {goal.asset_category}
                        {goal.expected_return_rate ? ` • Return ${goal.expected_return_rate}%/thn` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(goal)}
                      className="p-1.5 rounded-lg text-text-secondary hover:bg-secondary hover:text-primary transition-colors"
                      aria-label="Edit goal"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteGoalTarget(goal)}
                      className="p-1.5 rounded-lg text-text-secondary hover:bg-expense/10 hover:text-expense transition-colors"
                      aria-label="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <ProgressBar value={goal.current_amount} max={goal.target_amount} />

                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">
                    {formatMoney(goal.current_amount, currency)} dari {formatMoney(goal.target_amount, currency)}
                  </span>
                  <span className="text-xs font-bold text-primary">{pct}%</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-secondary">
                  <div className="text-xs space-y-0.5">
                    <p className="text-text-secondary">
                      Target {formatDateShort(goal.target_date)} • {durationLabel(monthsBetween(new Date(), new Date(goal.target_date)))}
                    </p>
                    <p className="text-text-secondary">
                      Estimasi tabungan: <span className="font-semibold text-text-primary">{formatMoney(goal.monthly_contribution, currency)}/bln</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => { setDepositGoal(goal); setDepositWallet(''); setDepositAmount(''); }}
                  >
                    <Wallet className="w-4 h-4 inline mr-1" />
                    Add Money
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Goal Sheet */}
      <Sheet open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Goal' : 'Create Goals'}>
        <div className="space-y-4">
          <Input
            label="Goals"
            placeholder="Beli Mobil Honda HR-V"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Input
            label="Jumlah Target"
            prefix={getCurrencySymbol(currency)}
            placeholder="150.000.000"
            inputMode="numeric"
            value={targetAmount ? formatMoneyInput(parseMoneyInput(targetAmount), currency) : ''}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="text-xl font-bold"
          />
          <Input
            label="Tanggal Target"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
          <Select
            label="Kategori Aset"
            value={category}
            onChange={(e) => setCategory(e.target.value as Goal['asset_category'])}
          >
            {ASSET_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </Select>

          {isInvestment && (
            <>
              <Input
                label="Ekspektasi Return Pertahun (%)"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={returnRate}
                onChange={(e) => setReturnRate(e.target.value)}
              />
              <p className="text-xs text-text-secondary -mt-2">Default 5% — gunakan untuk menghitung manfaat investasi.</p>
            </>
          )}

          <div className="rounded-xl bg-secondary/60 p-4 space-y-2">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Ringkasan</p>
            <SummaryRow label="Total Target" value={formatMoney(amount, currency)} />
            <SummaryRow label="Durasi" value={durationLabel(months)} />
            <SummaryRow
              label="Aset"
              value={isInvestment ? `${categoryLabel} (Return ${rate}%/thn)` : categoryLabel}
            />
            <SummaryRow label="Tabungan / Bulan" value={formatMoney(pmt, currency)} highlight />
            {isInvestment && rate > 0 && (
              <p className="text-xs text-income font-medium">
                Hemat {formatMoney(pmt0 - pmt, currency)}/bln dibanding tanpa return ({formatMoney(pmt0, currency)}/bln)
              </p>
            )}
          </div>

          <Button
            fullWidth
            onClick={handleSave}
            disabled={saving || !title.trim() || !amount || !targetDate}
          >
            {saving ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Create Goals'}
          </Button>
        </div>
      </Sheet>

      {/* Deposit Sheet */}
      <Sheet
        open={!!depositGoal}
        onClose={() => setDepositGoal(null)}
        title={depositGoal ? `Deposit: ${depositGoal.title}` : 'Deposit'}
      >
        <div className="space-y-4">
          <Select
            label="Dari Wallet"
            value={depositWallet}
            onChange={(e) => setDepositWallet(e.target.value)}
          >
            <option value="">Pilih Wallet</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>{w.name} — {formatMoney(w.balance, currency)}</option>
            ))}
          </Select>
          <Input
            label="Jumlah Deposit"
            prefix={getCurrencySymbol(currency)}
            placeholder="500.000"
            inputMode="numeric"
            value={depositAmount ? formatMoneyInput(parseMoneyInput(depositAmount), currency) : ''}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="text-xl font-bold"
            autoFocus
          />
          <Button
            fullWidth
            onClick={handleDeposit}
            disabled={depositing || !depositWallet || !parseMoneyInput(depositAmount)}
          >
            {depositing ? 'Memproses...' : 'Konfirmasi Deposit'}
          </Button>
        </div>
      </Sheet>

      {deleteGoalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-display font-bold text-lg text-text-primary">Hapus Goal?</h3>
              <p className="text-sm text-text-secondary">
                Goal "{deleteGoalTarget.title}" akan dihapus.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteGoalTarget(null)}
                className="flex-1 py-3 rounded-xl font-semibold text-text-primary bg-secondary hover:bg-secondary/80 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-all"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}