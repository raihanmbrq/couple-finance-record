import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { WalletGrid } from '@/components/desktop/wallet/WalletGrid';
import { SelectedWalletPanel } from '@/components/desktop/wallet/SelectedWalletPanel';
import { DesktopWalletFormModal } from '@/components/desktop/wallet/DesktopWalletFormModal';
import { DesktopTransferModal, type DesktopTransferMode } from '@/components/desktop/wallet/DesktopTransferModal';
import { DesktopWalletTypesModal } from '@/components/desktop/wallet/DesktopWalletTypesModal';
import { CustomDesktopDropdown } from '@/components/desktop/ui/CustomDesktopDropdown';
import { Wallet, Search, Plus, Settings2, Users2, Wallet as WalletIcon } from 'lucide-react';
import type { HouseholdMember, Wallet as WalletModel } from '@/lib/types';

interface DesktopWalletsWorkspaceProps {
  /** Navigate to the Transactions workspace (for "View All Wallet Transactions"). */
  onViewAllTransactions?: () => void;
}

type VisibilityFilter = 'all' | 'active' | 'hidden';

const VISIBILITY_KEY = 'pairflow_wallet_circle_hidden';
const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

/** Per-device circle-visibility preference map (walletId -> hidden). */
function readHiddenMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(VISIBILITY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

export const DesktopWalletsWorkspace: React.FC<DesktopWalletsWorkspaceProps> = ({ onViewAllTransactions }) => {
  const { wallets, walletTypes, household, householdMembers, profile } = useApp();
  const { t } = useLanguage();
  const currency = profile?.currency ?? 'IDR';

  // Global privacy toggle (shared with the header) — masks balances.
  const [hideBalance, setHideBalance] = useState<boolean>(() =>
    localStorage.getItem('pairflow_privacy_hide_balance') === 'true',
  );
  useEffect(() => {
    const sync = () => setHideBalance(localStorage.getItem('pairflow_privacy_hide_balance') === 'true');
    window.addEventListener('pairflow_privacy_change', sync);
    return () => window.removeEventListener('pairflow_privacy_change', sync);
  }, []);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  const [hiddenMap, setHiddenMap] = useState<Record<string, boolean>>(() => readHiddenMap());

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletModel | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferMode, setTransferMode] = useState<DesktopTransferMode>('transfer');
  const [transferWalletId, setTransferWalletId] = useState<string | undefined>(undefined);
  const [typesOpen, setTypesOpen] = useState(false);

  const persistHidden = (next: Record<string, boolean>) => {
    setHiddenMap(next);
    try {
      localStorage.setItem(VISIBILITY_KEY, JSON.stringify(next));
    } catch {
      /* ignore storage errors */
    }
  };

  const toggleVisibility = (id: string) => {
    persistHidden({ ...hiddenMap, [id]: !(hiddenMap[id] === true) });
  };

  const memberName = (m: HouseholdMember) =>
    m.profile?.full_name || m.profile?.email?.split('@')[0] || 'Member';

  const matchesFilters = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (w: WalletModel) => {
      if (q) {
        const typeName = walletTypes.find((wt) => wt.id === w.type)?.name ?? '';
        const haystack = `${w.name} ${typeName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (typeFilter !== 'all' && w.type !== typeFilter) return false;
      const isHidden = hiddenMap[w.id] === true;
      if (visibilityFilter === 'active' && isHidden) return false;
      if (visibilityFilter === 'hidden' && !isHidden) return false;
      return true;
    };
  }, [search, typeFilter, visibilityFilter, walletTypes, hiddenMap]);

  const personalWallets = useMemo(
    () => wallets.filter((w) => !w.user_id || w.user_id === profile?.id),
    [wallets, profile],
  );

  const circleWallets = useMemo(
    () => wallets.filter((w) => Boolean(w.user_id) && w.user_id !== profile?.id),
    [wallets, profile],
  );

  const visiblePersonal = personalWallets.filter(matchesFilters);
  const visibleCircle = circleWallets.filter(matchesFilters);

  const activeCount = wallets.filter((w) => hiddenMap[w.id] !== true).length;
  const hiddenCount = wallets.filter((w) => hiddenMap[w.id] === true).length;

  const selectedWallet = useMemo(
    () => wallets.find((w) => w.id === selectedWalletId) ?? null,
    [wallets, selectedWalletId],
  );

  // Auto-select the first available wallet (personal first) when nothing is selected.
  useEffect(() => {
    if (selectedWalletId && wallets.some((w) => w.id === selectedWalletId)) return;
    const first = personalWallets[0] ?? circleWallets[0] ?? null;
    setSelectedWalletId(first ? first.id : null);
  }, [wallets, personalWallets, circleWallets, selectedWalletId]);

  const ownerLabelFor = (w: WalletModel): string | undefined => {
    const member = householdMembers.find((m) => m.user_id === w.user_id);
    return member ? memberName(member) : undefined;
  };

  const typeOptions = useMemo(
    () => [
      { value: 'all', label: t('walletWs.filterAllTypes') },
      ...walletTypes.map((wt) => ({ value: wt.id, label: wt.name })),
    ],
    [walletTypes, t],
  );

  const openAdd = () => {
    setEditingWallet(null);
    setFormOpen(true);
  };

  const openEdit = (w: WalletModel) => {
    setEditingWallet(w);
    setFormOpen(true);
  };

  const openTransfer = (w: WalletModel, mode: DesktopTransferMode) => {
    setTransferMode(mode);
    setTransferWalletId(w.id);
    setTransferOpen(true);
  };

  return (
    <div data-testid="desktop-wallets-workspace" className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">{t('walletWs.title')}</h1>
            <p className="text-xs text-text-muted">{t('walletWs.subtitle')}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Instant wallet search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('walletWs.searchPlaceholder')}
              aria-label={t('walletWs.searchPlaceholder')}
              data-testid="wallet-search-input"
              className="w-52 rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-xs text-text-primary placeholder-text-muted transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 lg:w-64"
            />
          </div>

          <button
            type="button"
            onClick={openAdd}
            data-testid="add-wallet-btn"
            className={`flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-bold text-accent-text transition-opacity hover:opacity-90 ${FOCUS_RING}`}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('walletWs.addNewWallet')}
          </button>

          <button
            type="button"
            onClick={() => setTypesOpen(true)}
            data-testid="manage-wallet-types-btn"
            className={`flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary ${FOCUS_RING}`}
          >
            <Settings2 className="h-3.5 w-3.5" />
            {t('walletWs.manageTypes')}
          </button>
        </div>
      </div>

      {/* Main content — 12-col grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* LEFT PANEL — Wallet cards grid */}
        <div className="space-y-6 xl:col-span-8">
          {/* SECTION 1: Personal wallets */}
          <section
            className="rounded-2xl border border-border bg-surface p-5 shadow-xs"
            data-testid="wallet-section-personal"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                <WalletIcon className="h-4 w-4 text-accent" />
                {t('walletWs.personalSection')}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <CustomDesktopDropdown
                  options={typeOptions}
                  value={typeFilter}
                  onChange={setTypeFilter}
                  testId="wallet-type-filter"
                />
                <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-hover/60 p-0.5">
                  {([
                    { key: 'all' as VisibilityFilter, label: t('walletWs.filterAllTypes') },
                    { key: 'active' as VisibilityFilter, label: t('walletWs.filterActive', { count: activeCount }) },
                    { key: 'hidden' as VisibilityFilter, label: t('walletWs.filterHidden', { count: hiddenCount }) },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setVisibilityFilter(opt.key)}
                      data-testid={`wallet-visibility-filter-${opt.key}`}
                      aria-pressed={visibilityFilter === opt.key}
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${FOCUS_RING} ${
                        visibilityFilter === opt.key
                          ? 'bg-accent text-accent-text'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {personalWallets.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-text-muted">
                {t('walletWs.noWallets')}
              </p>
            ) : visiblePersonal.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-text-muted">
                {t('walletWs.noSearchResults')}
              </p>
            ) : (
              <WalletGrid
                wallets={visiblePersonal}
                walletTypes={walletTypes}
                currency={currency}
                hideBalance={hideBalance}
                hiddenMap={hiddenMap}
                selectedId={selectedWalletId}
                selectedLabel={t('walletWs.selected')}
                addLabel={t('home.addNewWallet')}
                onSelect={(w) => setSelectedWalletId(w.id)}
                onEdit={openEdit}
                onTransfer={(w) => openTransfer(w, 'transfer')}
                onAdd={openAdd}
              />
            )}
          </section>

          {/* SECTION 2: Circle / spouse wallets */}
          {(circleWallets.length > 0 || household?.mode === 'couple') && (
            <section
              className="rounded-2xl border border-border bg-surface p-5 shadow-xs"
              data-testid="wallet-section-circle"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h2 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                  <Users2 className="h-4 w-4 text-accent" />
                  {t('walletWs.circleSection')}
                </h2>
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent">
                  👥 {t('walletWs.circleLabel', { name: household?.name || 'Household' })}
                </span>
              </div>

              {circleWallets.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-text-muted">
                  {t('walletWs.noWallets')}
                </p>
              ) : visibleCircle.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-text-muted">
                  {t('walletWs.noSearchResults')}
                </p>
              ) : (
                <WalletGrid
                  wallets={visibleCircle}
                  walletTypes={walletTypes}
                  currency={currency}
                  hideBalance={hideBalance}
                  hiddenMap={hiddenMap}
                  selectedId={selectedWalletId}
                  ownerLabelFor={ownerLabelFor}
                  selectedLabel={t('walletWs.selected')}
                  addLabel={t('home.addNewWallet')}
                  onSelect={(w) => setSelectedWalletId(w.id)}
                  onEdit={openEdit}
                  onTransfer={(w) => openTransfer(w, 'transfer')}
                  onAdd={openAdd}
                />
              )}
            </section>
          )}
        </div>

        {/* RIGHT PANEL — Selected wallet workspace */}
        <div className="xl:col-span-4">
          <SelectedWalletPanel
            wallet={selectedWallet}
            currency={currency}
            hideBalance={hideBalance}
            hiddenFromCircle={Boolean(selectedWallet && hiddenMap[selectedWallet.id] === true)}
            onToggleVisibility={() => selectedWallet && toggleVisibility(selectedWallet.id)}
            onEdit={() => selectedWallet && openEdit(selectedWallet)}
            onTransfer={() => selectedWallet && openTransfer(selectedWallet, 'transfer')}
            onTopUp={() => selectedWallet && openTransfer(selectedWallet, 'topup')}
            onViewAllTransactions={onViewAllTransactions ?? (() => {})}
          />
        </div>
      </div>

      {/* Desktop-native dialogs */}
      <DesktopWalletFormModal
        open={formOpen}
        wallet={editingWallet}
        onClose={() => {
          setFormOpen(false);
          setEditingWallet(null);
        }}
      />

      <DesktopTransferModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        mode={transferMode}
        walletId={transferWalletId}
      />

      <DesktopWalletTypesModal open={typesOpen} onClose={() => setTypesOpen(false)} />

    </div>
  );
};
