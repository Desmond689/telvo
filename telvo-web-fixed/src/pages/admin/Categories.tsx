import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  setCategoryActive,
} from '@/services/categoryService';
import type { ServiceCategory } from '@/types';
import { Layers, Plus, Eye, EyeOff } from 'lucide-react';

export function AdminCategories() {
  const [categories, setCategories] = useState<ServiceCategory[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newEn, setNewEn] = useState('');
  const [newFr, setNewFr] = useState('');

  const load = () => getAllCategoriesAdmin().then(setCategories);
  useEffect(() => { load(); }, []);

  const toggleActive = async (c: ServiceCategory) => {
    setBusyId(c.id);
    try {
      await setCategoryActive(c.id, !c.isActive);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleAdd = async () => {
    if (!newEn.trim() || !newFr.trim()) return;
    setAdding(true);
    try {
      const slug = newEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await createCategory({
        name: { en: newEn.trim(), fr: newFr.trim() },
        slug,
        icon: 'Wrench',
        sortOrder: (categories?.length ?? 0) + 1,
      });
      setNewEn('');
      setNewFr('');
      await load();
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Layers size={22} className="text-brand-600" />
        <h1 className="text-2xl font-bold text-ink-900">Categories</h1>
      </div>
      <p className="text-sm text-ink-500 mb-6">
        Add, rename, or hide service categories without a code deploy. Hidden categories stay off Browse/Find
        Services but existing jobs already using them are unaffected.
      </p>

      <Card className="p-6 mb-6">
        <h2 className="font-semibold text-ink-900 mb-4">Add a category</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Name (English)" value={newEn} onChange={(e) => setNewEn(e.target.value)} placeholder="Gardening" />
          <Input label="Name (French)" value={newFr} onChange={(e) => setNewFr(e.target.value)} placeholder="Jardinage" />
        </div>
        <Button className="mt-4" icon={<Plus size={16} />} loading={adding} disabled={!newEn.trim() || !newFr.trim()} onClick={handleAdd}>
          Add category
        </Button>
      </Card>

      {categories === null && <p className="text-sm text-ink-400">Loading...</p>}
      <div className="space-y-2">
        {categories?.map((c) => (
          <Card key={c.id} className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-ink-900">{c.name.en} <span className="text-ink-400 font-normal">/ {c.name.fr}</span></p>
              <p className="text-xs text-ink-400">{c.slug}</p>
            </div>
            <Button
              size="sm"
              variant={c.isActive ? 'outline' : 'secondary'}
              icon={c.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
              loading={busyId === c.id}
              onClick={() => toggleActive(c)}
            >
              {c.isActive ? 'Hide' : 'Show'}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
