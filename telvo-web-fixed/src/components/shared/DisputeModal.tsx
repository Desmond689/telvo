import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { raiseDispute } from '@/services/jobService';
import type { Job } from '@/types';

export function DisputeModal({
  job,
  userId,
  open,
  onClose,
}: {
  job: Job;
  userId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const handleClose = () => {
    setReason('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await raiseDispute(job.id, userId, reason.trim(), job.status);
      handleClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Report a problem">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 text-amber-700">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <p className="text-sm">
            This pauses the job and sends it to TELVO's team for review. Tell us what went wrong so we can help
            resolve it fairly.
          </p>
        </div>
        <Textarea
          label="What happened?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. The professional never showed up, or the work wasn't as agreed..."
        />
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose} disabled={busy}>Cancel</Button>
          <Button variant="danger" onClick={handleSubmit} loading={busy} disabled={!reason.trim()}>
            Submit report
          </Button>
        </div>
      </div>
    </Modal>
  );
}
