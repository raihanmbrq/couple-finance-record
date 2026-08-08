import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface EditProfileSheetProps {
  open: boolean;
  onClose: () => void;
}

export function EditProfileSheet({ open, onClose }: EditProfileSheetProps) {
  const { profile, updateProfile } = useApp();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setAvatarUrl(profile.avatar_url ?? '');
      setError('');
    }
  }, [profile, open]);

  const handleSave = async () => {
    if (!profile) return;
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await updateProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Edit Profile">
      <div className="space-y-5">
        <Input
          label="Full Name"
          placeholder="Your name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <Input
          label="Photo URL (optional)"
          placeholder="https://..."
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />

        {error && <p className="text-sm text-expense">{error}</p>}

        <Button fullWidth onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </Sheet>
  );
}
