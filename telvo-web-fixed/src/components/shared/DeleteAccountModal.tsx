import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

// Full account-deletion flow:
//  - Type "DELETE" to confirm intent (protects against a stray click).
//  - Email/password accounts must also re-enter their password, since
//    Firebase requires a "recent login" before it will delete a user.
//  - On success, signs the user out to the home page.
export function DeleteAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { firebaseUser, deleteAccount, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const needsPassword = !!firebaseUser?.email;
  const canDelete = confirmText.trim().toUpperCase() === 'DELETE' && (!needsPassword || password.length > 0);

  const handleClose = () => {
    setConfirmText('');
    setPassword('');
    clearError();
    onClose();
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    try {
      await deleteAccount(needsPassword ? password : undefined);
      navigate('/', { replace: true });
    } catch {
      // Error message is surfaced from AuthContext.error below.
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Delete account">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 text-red-700">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            This permanently deletes your TELVO account. Your profile, photos, and login access are removed and
            cannot be recovered. Job and message history tied to your account is anonymized, not deleted, so the
            people you worked with keep an accurate record.
          </p>
        </div>

        {needsPassword && (
          <Input
            label="Confirm your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your current password"
          />
        )}

        <Input
          label={'Type "DELETE" to confirm'}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={handleClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={!canDelete} loading={deleting}>
            Delete my account
          </Button>
        </div>
      </div>
    </Modal>
  );
}
