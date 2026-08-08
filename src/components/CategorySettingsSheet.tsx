import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { CATEGORY_ICON_OPTIONS, type TransactionCategoryType } from '@/lib/types';
import { getIcon } from '@/lib/icons';
import { Pencil, Trash2 } from 'lucide-react';

interface CategorySettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

const TYPE_OPTIONS: { value: TransactionCategoryType; labelKey: string }[] = [
  { value: 'expense', labelKey: 'cat.typeExpense' },
  { value: 'income', labelKey: 'cat.typeIncome' },
  { value: 'both', labelKey: 'cat.typeBoth' },
];

export function CategorySettingsSheet({ open, onClose }: CategorySettingsSheetProps) {
  const { categories, updateCategory, deleteCategory } = useApp();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<TransactionCategoryType>('expense');
  const [editIcon, setEditIcon] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const customCategories = categories.filter((c) => !c.is_system);

  const startEdit = (id: string, name: string, type: TransactionCategoryType, icon: string) => {
    setEditingId(id);
    setEditName(name);
    setEditType(type);
    setEditIcon(icon);
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError('');
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) {
      setError(t('cat.nameRequired'));
      return;
    }
    setError('');
    setSaving(true);
    try {
      const updates: { name: string; type?: TransactionCategoryType; icon?: string } = { name: editName.trim() };
      if (editType) updates.type = editType;
      if (editIcon) updates.icon = editIcon;
      await updateCategory(id, updates);
      setEditingId(null);
      showToast(t('cat.updatedToast'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(msg || t('cat.failedUpdate'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      showToast(t('cat.deletedToast'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      setError(msg || t('cat.failedDelete'));
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('cat.manageTitle')}>
      <div className="space-y-4">
        {customCategories.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-6">
            {t('cat.noCustom')}
          </p>
        )}

        {customCategories.map((c) => {
          const Icon = getIcon(c.icon);
          return (
            <div
              key={c.id}
              className={editingId === c.id ? 'space-y-3' : 'p-3 rounded-xl border border-secondary bg-secondary space-y-3'}
            >
              {editingId === c.id ? (
                <div className="space-y-5">
                  <Input
                    label={t('cat.nameLabel')}
                    placeholder={t('cat.namePlaceholder')}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">{t('cat.typeLabel')}</label>
                    <div className="flex gap-2">
                      {TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEditType(opt.value)}
                          className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 ${
                            editType === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-secondary bg-secondary text-text-secondary'
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
                        const IconOption = getIcon(iconName);
                        const isActive = editIcon === iconName;
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setEditIcon(iconName)}
                            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all border-2 ${
                              isActive ? 'border-primary bg-primary/10' : 'border-transparent bg-secondary'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/20' : 'bg-secondary'}`}>
                              <IconOption className={`w-4.5 h-4.5 ${isActive ? 'text-primary' : 'text-text-secondary'}`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {error && <p className="text-sm text-expense">{error}</p>}

                  <Button fullWidth onClick={() => saveEdit(c.id)} disabled={saving}>
                    {saving ? t('cat.saving') : t('cat.saveCategory')}
                  </Button>
                  <Button fullWidth variant="secondary" onClick={cancelEdit}>
                    {t('common.cancel')}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary-hover flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5 text-text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{c.name}</p>
                    <p className="text-xs text-text-secondary">{TYPE_OPTIONS.find((o) => o.value === c.type) ? t(TYPE_OPTIONS.find((o) => o.value === c.type)!.labelKey) : c.type}</p>
                  </div>
                  <button
                    onClick={() => startEdit(c.id, c.name, c.type, c.icon)}
                    className="p-2 rounded-lg text-text-secondary hover:bg-secondary-hover"
                    aria-label={t('cat.editCategory')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-2 rounded-lg text-expense hover:bg-expense/10"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <Button fullWidth variant="secondary" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </Sheet>
  );
}