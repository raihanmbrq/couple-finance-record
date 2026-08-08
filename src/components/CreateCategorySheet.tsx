import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { CATEGORY_ICON_OPTIONS, type TransactionCategoryType } from '@/lib/types';
import { getIcon } from '@/lib/icons';

interface CreateCategorySheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

const TYPE_OPTIONS: { value: TransactionCategoryType; labelKey: string }[] = [
  { value: 'expense', labelKey: 'cat.typeExpense' },
  { value: 'income', labelKey: 'cat.typeIncome' },
  { value: 'both', labelKey: 'cat.typeBoth' },
];

export function CreateCategorySheet({ open, onClose, onCreated }: CreateCategorySheetProps) {
  const { addCustomCategory } = useApp();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionCategoryType>('expense');
  const [icon, setIcon] = useState('Sparkles');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('cat.nameRequired'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const created = await addCustomCategory(name.trim(), icon, type);
      setName('');
      setType('expense');
      setIcon('Sparkles');
      onClose();
      showToast(t('cat.addedToast'));
      onCreated(created.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(msg || t('cat.failedAdd'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('cat.addTitle')}>
      <div className="space-y-5">
        <Input
          label={t('cat.nameLabel')}
          placeholder={t('cat.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">{t('cat.typeLabel')}</label>
          <div className="flex gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 ${
                  type === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-secondary bg-secondary text-text-secondary'
                }`}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">{t('cat.iconLabel')}</label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORY_ICON_OPTIONS.map((iconName) => {
              const Icon = getIcon(iconName);
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`flex items-center justify-center p-3 rounded-xl border-2 transition-all ${
                    icon === iconName ? 'border-primary bg-primary/10' : 'border-secondary bg-secondary'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${icon === iconName ? 'text-primary' : 'text-text-secondary'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-expense">{error}</p>}

        <Button fullWidth onClick={handleSubmit} disabled={loading}>
          {loading ? t('cat.saving') : t('cat.saveCategory')}
        </Button>
      </div>
    </Sheet>
  );
}