import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatMoney } from '@/lib/format';
import { FileSpreadsheet, Upload, Check, AlertCircle, X, ArrowRight, Table } from 'lucide-react';

interface StatementUploaderModalProps {
  open: boolean;
  onClose: () => void;
}

type BankPreset = 'bca' | 'mandiri' | 'bsi' | 'gopay' | 'ovo' | 'generic';

interface ParsedRow {
  date: string;
  notes: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}

export const StatementUploaderModal: React.FC<StatementUploaderModalProps> = ({ open, onClose }) => {
  const { wallets, addTransaction, profile } = useApp();
  const currency = profile?.currency || 'IDR';

  const [preset, setPreset] = useState<BankPreset>('generic');
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || '');
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);

  // Mapping Configuration
  const [dateColIdx, setDateColIdx] = useState<number>(0);
  const [notesColIdx, setNotesColIdx] = useState<number>(1);
  const [amountColIdx, setAmountColIdx] = useState<number>(2);
  const [typeColIdx, setTypeColIdx] = useState<number>(-1); // -1 means default to expense

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');
  const [isImporting, setIsImporting] = useState(false);
  const [importCount, setImportCount] = useState<number | null>(null);

  if (!open) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const parseCsv = (text: string) => {
    setRawCsvText(text);
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return;

    // Simple CSV parser handling quotes
    const rows = lines.map((line) => {
      const parts = line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/);
      return parts.map((p) => p.replace(/^"|"$/g, '').trim());
    });

    if (rows.length > 0) {
      setCsvHeaders(rows[0]);
      setCsvRows(rows.slice(1));
      
      // Preset auto-detection guess
      if (rows[0].length >= 3) {
        setDateColIdx(0);
        setNotesColIdx(1);
        setAmountColIdx(rows[0].length - 1);
      }
      setStep('mapping');
    }
  };

  // Convert CSV rows to parsed transaction items
  const getParsedTransactions = (): ParsedRow[] => {
    return csvRows
      .map((row) => {
        const rawDate = row[dateColIdx] || new Date().toISOString().slice(0, 10);
        const notes = row[notesColIdx] || 'Imported Transaction';
        const rawAmountStr = (row[amountColIdx] || '0').replace(/[^0-9.-]/g, '');
        const parsedAmount = Math.abs(parseFloat(rawAmountStr) || 0);

        let type: 'income' | 'expense' = 'expense';
        if (typeColIdx >= 0 && row[typeColIdx]) {
          const typeVal = row[typeColIdx].toLowerCase();
          if (typeVal.includes('cr') || typeVal.includes('in') || typeVal.includes('kredit') || typeVal.includes('+')) {
            type = 'income';
          }
        }

        return {
          date: rawDate,
          notes,
          amount: parsedAmount,
          type,
          category: type === 'income' ? 'salary' : 'other',
        };
      })
      .filter((tx) => tx.amount > 0);
  };

  const handleExecuteImport = async () => {
    setIsImporting(true);
    const parsed = getParsedTransactions();
    const targetWallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0];

    try {
      for (const tx of parsed) {
        await addTransaction({
          wallet_id: targetWallet ? targetWallet.id : '',
          wallet_name: targetWallet ? targetWallet.name : 'Wallet',
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          notes: tx.notes,
          spent_by: profile?.role || 'member',
          transaction_date: tx.date,
        });
      }
      setImportCount(parsed.length);
      setTimeout(() => {
        setIsImporting(false);
        onClose();
        setStep('upload');
        setImportCount(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      setIsImporting(false);
    }
  };

  const parsedTxList = getParsedTransactions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        data-testid="statement-uploader-modal"
        className="bg-surface border border-border rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="h-14 px-6 border-b border-border flex items-center justify-between bg-surface-hover/50">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-accent" />
            <h2 className="text-base font-bold text-text-primary">Bank Statement CSV Importer</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-text-muted hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Preset & Target Wallet Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-hover/40 p-4 rounded-xl border border-border">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Select Statement Format</label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value as BankPreset)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium"
              >
                <option value="generic">Generic Bank CSV</option>
                <option value="bca">BCA e-Statement CSV</option>
                <option value="mandiri">Bank Mandiri Livin CSV</option>
                <option value="bsi">BSI Mobile CSV</option>
                <option value="gopay">GoPay Transaction History</option>
                <option value="ovo">OVO Statement</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Target Wallet for Batch Import</label>
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                data-testid="select-import-wallet"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatMoney(w.balance, currency)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STEP 1: Upload File */}
          {step === 'upload' && (
            <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-accent transition-colors flex flex-col items-center justify-center space-y-3 bg-surface-hover/20">
              <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Click or Drag & Drop CSV Bank Mutasi Statement</p>
                <p className="text-xs text-text-muted mt-1">Supports UTF-8 CSV exports from all major Indonesian banks & e-wallets</p>
              </div>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                data-testid="import-csv-file-input"
                className="hidden"
                id="csv-file-input"
              />
              <label
                htmlFor="csv-file-input"
                data-testid="import-statement-btn"
                className="px-4 py-2 rounded-xl bg-accent text-accent-text text-xs font-bold hover:opacity-90 cursor-pointer shadow-xs"
              >
                Choose File...
              </label>
            </div>
          )}

          {/* STEP 2: Column Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Step 2: Map CSV Columns</h3>
                <span className="text-xs text-text-muted">{csvRows.length} rows loaded</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Date Column</label>
                  <select
                    value={dateColIdx}
                    onChange={(e) => setDateColIdx(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-surface border border-border rounded-xl text-xs"
                  >
                    {csvHeaders.map((h, idx) => (
                      <option key={idx} value={idx}>{idx + 1}. {h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Notes / Description Column</label>
                  <select
                    value={notesColIdx}
                    onChange={(e) => setNotesColIdx(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-surface border border-border rounded-xl text-xs"
                  >
                    {csvHeaders.map((h, idx) => (
                      <option key={idx} value={idx}>{idx + 1}. {h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1">Amount Column</label>
                  <select
                    value={amountColIdx}
                    onChange={(e) => setAmountColIdx(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-surface border border-border rounded-xl text-xs"
                  >
                    {csvHeaders.map((h, idx) => (
                      <option key={idx} value={idx}>{idx + 1}. {h}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-border text-text-muted hover:bg-surface-hover"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('preview')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-accent text-accent-text hover:opacity-90 flex items-center gap-1.5"
                >
                  <span>Preview ({parsedTxList.length} items)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Confirm */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Step 3: Preview Batch Insertion</h3>
                <span className="text-xs font-bold text-accent">{parsedTxList.length} Ready to Insert</span>
              </div>

              <div className="border border-border rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-hover/70 border-b border-border text-text-muted">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Notes</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {parsedTxList.map((tx, i) => (
                      <tr key={i} className="hover:bg-surface-hover/40">
                        <td className="py-2 px-3 font-medium">{tx.date}</td>
                        <td className="py-2 px-3 text-text-muted max-w-xs truncate">{tx.notes}</td>
                        <td className="py-2 px-3 font-medium capitalize">{tx.type}</td>
                        <td className={`py-2 px-3 text-right font-bold ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {formatMoney(tx.amount, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-border text-text-muted hover:bg-surface-hover"
                >
                  Edit Mapping
                </button>
                <button
                  onClick={handleExecuteImport}
                  disabled={isImporting || parsedTxList.length === 0}
                  data-testid="confirm-batch-import-btn"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-accent text-accent-text hover:opacity-90 flex items-center gap-2 shadow-sm"
                >
                  {isImporting ? (
                    <span>Importing...</span>
                  ) : importCount !== null ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Imported {importCount} Transactions!</span>
                    </>
                  ) : (
                    <>
                      <Table className="w-4 h-4" />
                      <span>Confirm & Import {parsedTxList.length} Transactions</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

