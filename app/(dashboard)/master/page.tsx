'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, Pencil, BookOpen, Check, X, Loader2,
  Trash2, ToggleLeft, ToggleRight, ChefHat, Package,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Dish {
  id: string;
  name: string;
  category: string;
  unit_type?: string;
  is_active: boolean;
  has_recipe?: boolean;
  recipe_count?: number;
  cost_per_unit?: string | number;
}

interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit_of_measure: string;
  is_active: boolean;
}

interface RecipeLine {
  id?: string;
  ingredient: string;
  ingredient_name?: string;
  ingredient_unit?: string;
  quantity: string;
  unit?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const DISH_CATEGORIES = ['All', 'Starter', 'Main Course', 'Dessert', 'Beverage', 'Bread', 'Rice', 'Salad', 'Snack', 'Other'];
const ING_CATEGORIES  = ['All', 'Grocery', 'Vegetable', 'Meat', 'Fruit', 'Disposable', 'Rental', 'Dairy', 'Spice', 'Other'];
const UNIT_TYPES      = ['Plate', 'Piece', 'Kg', 'Litre', 'Portion', 'Bowl', 'Cup', 'Box'];
const UNITS_OF_MEASURE = ['kg', 'g', 'litre', 'ml', 'piece', 'packet', 'bunch', 'dozen', 'box', 'nos'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: active ? '#ECFDF5' : '#F1F5F9', color: active ? '#0D9488' : '#94A3B8' }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Generic Drawer Shell ─────────────────────────────────────────────────────

function Drawer({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; footer: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40 transition-opacity"
        style={{ backgroundColor: 'rgba(15,23,42,0.4)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.2s' }} />
      <div ref={ref} className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{ width: 480, backgroundColor: '#fff', transform: open ? 'translateX(0)' : 'translateX(100%)', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', transition: 'transform 0.25s ease' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E2E8F0' }}>
          <h2 className="font-semibold text-base" style={{ color: '#0F172A' }}>{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} style={{ color: '#64748B' }} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        <div className="border-t px-6 py-4" style={{ borderColor: '#E2E8F0' }}>{footer}</div>
      </div>
    </>
  );
}

// ─── Dish Form Drawer ─────────────────────────────────────────────────────────

const EMPTY_DISH = { name: '', category: '', unit_type: 'Plate', is_active: true };

function DishDrawer({ open, onClose, editing, onSaved }: {
  open: boolean; onClose: () => void; editing: Dish | null; onSaved: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_DISH });
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setForm(editing ? {
      name: editing.name, category: editing.category ?? '',
      unit_type: editing.unit_type ?? 'Plate', is_active: editing.is_active,
    } : { ...EMPTY_DISH });
  }, [editing, open]);

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      editing ? await api.patch(`/master/dishes/${editing.id}/`, form) : await api.post('/master/dishes/', form);
      toast.success(editing ? 'Dish updated' : 'Dish created');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(Object.values(err?.data ?? {}).flat().join(', ') || 'Failed to save');
    } finally { setSaving(false); }
  }

  const inp = 'w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors';
  const ist = { border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#0F172A' };
  const lbl = 'block text-xs font-medium mb-1.5';

  return (
    <Drawer open={open} onClose={onClose} title={editing ? 'Edit Dish' : 'Add Dish'}
      footer={
        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ color: '#64748B', border: '1px solid #E2E8F0' }}>Cancel</button>
          <button onClick={() => formRef.current?.requestSubmit()} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#D95F0E', opacity: saving ? 0.7 : 1 }}>
            {saving && <Loader2 size={14} className="animate-spin" />}{saving ? 'Saving…' : editing ? 'Update' : 'Save Dish'}
          </button>
        </div>
      }>
      <form ref={formRef} onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className={lbl} style={{ color: '#0F172A' }}>Dish Name <span style={{ color: '#DC2626' }}>*</span></label>
          <input className={inp} style={ist} required value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Chicken Biryani"
            onFocus={e => (e.currentTarget.style.borderColor = '#D95F0E')} onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl} style={{ color: '#0F172A' }}>Category</label>
            <select className={inp} style={ist} value={form.category} onChange={e => set('category', e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = '#D95F0E')} onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}>
              <option value="">Select</option>
              {DISH_CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl} style={{ color: '#0F172A' }}>Unit Type</label>
            <select className={inp} style={ist} value={form.unit_type} onChange={e => set('unit_type', e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = '#D95F0E')} onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}>
              {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <div onClick={() => set('is_active', !form.is_active)}
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{ backgroundColor: form.is_active ? '#0D9488' : '#CBD5E1' }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
              style={{ transform: form.is_active ? 'translateX(18px)' : 'translateX(2px)' }} />
          </div>
          <span className="text-sm" style={{ color: '#0F172A' }}>Active</span>
        </label>
      </form>
    </Drawer>
  );
}

// ─── Recipe Drawer ────────────────────────────────────────────────────────────

function RecipeDrawer({ dish, open, onClose, onSaved }: {
  dish: Dish | null; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [lines, setLines] = useState<RecipeLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [ingSearch, setIngSearch] = useState<Record<number, string>>({});

  const { data: recipe, isLoading: recipeLoading } = useQuery({
    queryKey: ['dish-recipe', dish?.id],
    queryFn: () => api.get(`/master/dishes/${dish!.id}/recipe/`),
    enabled: open && !!dish,
  });

  // Search ingredients per row
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [ingSearchText, setIngSearchText] = useState('');

  const { data: ingResults } = useQuery({
    queryKey: ['ing-search', ingSearchText],
    queryFn: () => api.get(`/master/ingredients/?search=${encodeURIComponent(ingSearchText)}&page_size=20&is_active=true`),
    enabled: ingSearchText.length >= 1,
  });
  const ingList: Ingredient[] = ingResults?.results ?? ingResults ?? [];

  useEffect(() => {
    if (!open) { setLines([]); setIngSearchText(''); setActiveRow(null); return; }
    const raw: any[] = recipe?.results ?? recipe ?? [];
    setLines(raw.map((r: any) => ({
      id: r.id,
      ingredient: r.ingredient ?? r.ingredient_id,
      ingredient_name: r.ingredient_name ?? r.ingredient_display,
      ingredient_unit: r.ingredient_unit ?? r.unit,
      quantity: String(r.quantity),
    })));
  }, [recipe, open]);

  function addLine() {
    setLines(l => [...l, { ingredient: '', ingredient_name: '', quantity: '1' }]);
  }

  function removeLine(i: number) {
    setLines(l => l.filter((_, j) => j !== i));
  }

  function setLine(i: number, k: keyof RecipeLine, v: string) {
    setLines(l => l.map((line, j) => j === i ? { ...line, [k]: v } : line));
  }

  function selectIngredient(idx: number, ing: Ingredient) {
    setLines(l => l.map((line, j) => j === idx ? {
      ...line,
      ingredient: ing.id,
      ingredient_name: ing.name,
      ingredient_unit: ing.unit_of_measure,
    } : line));
    setActiveRow(null);
    setIngSearchText('');
  }

  async function handleSave() {
    if (!dish) return;
    const valid = lines.filter(l => l.ingredient && parseFloat(l.quantity) > 0);
    if (valid.length === 0) { toast.error('Add at least one ingredient'); return; }
    setSaving(true);
    try {
      await api.put(`/master/dishes/${dish.id}/recipe/`, {
        lines: valid.map(l => ({ ingredient: l.ingredient, quantity: parseFloat(l.quantity) })),
      });
      toast.success('Recipe saved');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(Object.values(err?.data ?? {}).flat().join(', ') || 'Failed to save recipe');
    } finally { setSaving(false); }
  }

  const inp = 'px-3 py-2 rounded-lg text-sm outline-none transition-colors w-full';
  const ist = { border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#0F172A' };

  return (
    <Drawer open={open} onClose={onClose}
      title={dish ? `Recipe — ${dish.name}` : 'Recipe'}
      footer={
        <div className="flex items-center justify-between">
          <button onClick={addLine}
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: '#D95F0E' }}>
            <Plus size={14} /> Add Ingredient
          </button>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ color: '#64748B', border: '1px solid #E2E8F0' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ backgroundColor: '#1C3355', opacity: saving ? 0.7 : 1 }}>
              {saving && <Loader2 size={14} className="animate-spin" />}{saving ? 'Saving…' : 'Save Recipe'}
            </button>
          </div>
        </div>
      }>

      {recipeLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-1 mb-1">
            <span className="col-span-6 text-xs font-semibold" style={{ color: '#64748B' }}>Ingredient</span>
            <span className="col-span-3 text-xs font-semibold" style={{ color: '#64748B' }}>Qty</span>
            <span className="col-span-2 text-xs font-semibold" style={{ color: '#64748B' }}>Unit</span>
          </div>

          {lines.length === 0 && (
            <div className="flex flex-col items-center py-10" style={{ color: '#94A3B8' }}>
              <BookOpen size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No ingredients yet</p>
              <button onClick={addLine} className="mt-2 text-xs font-medium" style={{ color: '#D95F0E' }}>
                + Add first ingredient
              </button>
            </div>
          )}

          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              {/* Ingredient search */}
              <div className="col-span-6 relative">
                <input
                  value={activeRow === i ? ingSearchText : (line.ingredient_name || '')}
                  onFocus={() => { setActiveRow(i); setIngSearchText(line.ingredient_name || ''); }}
                  onChange={e => { setIngSearchText(e.target.value); setLine(i, 'ingredient_name', e.target.value); }}
                  placeholder="Search ingredient…"
                  className={inp} style={ist}
                  onBlurCapture={() => setTimeout(() => setActiveRow(null), 150)}
                />
                {activeRow === i && ingSearchText.length >= 1 && ingList.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 rounded-lg overflow-hidden max-h-40 overflow-y-auto"
                    style={{ border: '1px solid #E2E8F0', backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                    {ingList.map(ing => (
                      <button key={ing.id} onMouseDown={() => selectIngredient(i, ing)}
                        className="flex items-center justify-between w-full px-3 py-2 text-xs hover:bg-slate-50 text-left">
                        <span style={{ color: '#0F172A' }}>{ing.name}</span>
                        <span style={{ color: '#94A3B8' }}>{ing.unit_of_measure}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Qty */}
              <div className="col-span-3">
                <input type="number" min="0.01" step="0.01" value={line.quantity}
                  onChange={e => setLine(i, 'quantity', e.target.value)}
                  className={inp} style={ist} />
              </div>
              {/* Unit */}
              <div className="col-span-2">
                <span className="text-xs px-2 py-1 rounded" style={{ color: '#64748B', backgroundColor: '#F1F5F9' }}>
                  {line.ingredient_unit || '—'}
                </span>
              </div>
              {/* Remove */}
              <div className="col-span-1 flex justify-center">
                <button onClick={() => removeLine(i)} className="p-1 rounded hover:bg-red-50">
                  <X size={13} style={{ color: '#DC2626' }} />
                </button>
              </div>
            </div>
          ))}

          {lines.length > 0 && (
            <button onClick={addLine}
              className="flex items-center gap-1.5 mt-2 text-xs font-medium py-2 rounded-lg border-dashed"
              style={{ color: '#D95F0E', border: '1.5px dashed #FED7AA', width: '100%', justifyContent: 'center' }}>
              <Plus size={13} /> Add another ingredient
            </button>
          )}
        </div>
      )}
    </Drawer>
  );
}

// ─── Ingredient Form Drawer ───────────────────────────────────────────────────

const EMPTY_ING = { name: '', category: '', unit_of_measure: 'kg', is_active: true };

function IngredientDrawer({ open, onClose, editing, onSaved }: {
  open: boolean; onClose: () => void; editing: Ingredient | null; onSaved: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_ING });
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setForm(editing ? {
      name: editing.name, category: editing.category ?? '',
      unit_of_measure: editing.unit_of_measure ?? 'kg', is_active: editing.is_active,
    } : { ...EMPTY_ING });
  }, [editing, open]);

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      editing
        ? await api.patch(`/master/ingredients/${editing.id}/`, form)
        : await api.post('/master/ingredients/', form);
      toast.success(editing ? 'Ingredient updated' : 'Ingredient created');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(Object.values(err?.data ?? {}).flat().join(', ') || 'Failed to save');
    } finally { setSaving(false); }
  }

  const inp = 'w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors';
  const ist = { border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#0F172A' };
  const lbl = 'block text-xs font-medium mb-1.5';

  return (
    <Drawer open={open} onClose={onClose} title={editing ? 'Edit Ingredient' : 'Add Ingredient'}
      footer={
        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ color: '#64748B', border: '1px solid #E2E8F0' }}>Cancel</button>
          <button onClick={() => formRef.current?.requestSubmit()} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#D95F0E', opacity: saving ? 0.7 : 1 }}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving…' : editing ? 'Update' : 'Save Ingredient'}
          </button>
        </div>
      }>
      <form ref={formRef} onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className={lbl} style={{ color: '#0F172A' }}>Name <span style={{ color: '#DC2626' }}>*</span></label>
          <input className={inp} style={ist} required value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Chicken"
            onFocus={e => (e.currentTarget.style.borderColor = '#D95F0E')} onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={lbl} style={{ color: '#0F172A' }}>Category</label>
            <select className={inp} style={ist} value={form.category} onChange={e => set('category', e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = '#D95F0E')} onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}>
              <option value="">Select</option>
              {ING_CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl} style={{ color: '#0F172A' }}>Unit of Measure</label>
            <select className={inp} style={ist} value={form.unit_of_measure} onChange={e => set('unit_of_measure', e.target.value)}
              onFocus={e => (e.currentTarget.style.borderColor = '#D95F0E')} onBlur={e => (e.currentTarget.style.borderColor = '#E2E8F0')}>
              {UNITS_OF_MEASURE.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <div onClick={() => set('is_active', !form.is_active)}
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{ backgroundColor: form.is_active ? '#0D9488' : '#CBD5E1' }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
              style={{ transform: form.is_active ? 'translateX(18px)' : 'translateX(2px)' }} />
          </div>
          <span className="text-sm" style={{ color: '#0F172A' }}>Active</span>
        </label>
      </form>
    </Drawer>
  );
}

// ─── Dishes Tab ───────────────────────────────────────────────────────────────

function DishesTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [activeOnly, setActiveOnly] = useState(false);

  const [dishDrawer, setDishDrawer] = useState(false);
  const [recipeDrawer, setRecipeDrawer] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [recipeDish, setRecipeDish] = useState<Dish | null>(null);

  const qs = new URLSearchParams({
    ...(search ? { search } : {}),
    ...(category !== 'All' ? { category } : {}),
    ...(activeOnly ? { is_active: 'true' } : {}),
    page_size: '50',
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ['dishes', qs],
    queryFn: () => api.get(`/master/dishes/?${qs}`),
  });

  const dishes: Dish[] = data?.results ?? data ?? [];

  async function toggleActive(dish: Dish) {
    try {
      await api.patch(`/master/dishes/${dish.id}/`, { is_active: !dish.is_active });
      toast.success(dish.is_active ? 'Dish deactivated' : 'Dish activated');
      qc.invalidateQueries({ queryKey: ['dishes'] });
    } catch { toast.error('Failed to update'); }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[180px]"
          style={{ border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
          <Search size={14} style={{ color: '#94A3B8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dishes…"
            className="bg-transparent outline-none text-sm flex-1" style={{ color: '#0F172A' }} />
          {search && <button onClick={() => setSearch('')}><X size={12} style={{ color: '#94A3B8' }} /></button>}
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ border: '1.5px solid #E2E8F0', color: category !== 'All' ? '#0F172A' : '#94A3B8', backgroundColor: '#F8FAFC' }}>
          {DISH_CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
        </select>
        <label className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg"
          style={{ border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
          <div onClick={() => setActiveOnly(v => !v)}
            className="relative w-8 h-4 rounded-full transition-colors"
            style={{ backgroundColor: activeOnly ? '#0D9488' : '#CBD5E1' }}>
            <div className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform"
              style={{ transform: activeOnly ? 'translateX(17px)' : 'translateX(1px)' }} />
          </div>
          <span className="text-xs font-medium" style={{ color: '#64748B' }}>Active only</span>
        </label>
        <button onClick={() => { setEditingDish(null); setDishDrawer(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white ml-auto"
          style={{ backgroundColor: '#D95F0E' }}>
          <Plus size={15} /> Add Dish
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0', backgroundColor: '#fff' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {['Dish Name', 'Category', 'Unit Type', 'Has Recipe', 'Active', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#64748B' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
                </tr>
              ))
            ) : dishes.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-14 text-center">
                <ChefHat size={36} className="mx-auto mb-2 opacity-20" style={{ color: '#64748B' }} />
                <p className="text-sm" style={{ color: '#94A3B8' }}>No dishes found</p>
              </td></tr>
            ) : dishes.map(dish => (
              <tr key={dish.id} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td className="px-4 py-3 font-medium" style={{ color: '#0F172A' }}>{dish.name}</td>
                <td className="px-4 py-3">
                  {dish.category ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>{dish.category}</span>
                  ) : <span style={{ color: '#94A3B8' }}>—</span>}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: '#64748B' }}>{dish.unit_type || '—'}</td>
                <td className="px-4 py-3">
                  {dish.has_recipe
                    ? <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#0D9488' }}>
                        <Check size={13} /> Yes ({dish.recipe_count ?? '?'} ingredients)
                      </span>
                    : <span className="flex items-center gap-1 text-xs" style={{ color: '#DC2626' }}>
                        <X size={13} /> No recipe
                      </span>}
                </td>
                <td className="px-4 py-3"><ActiveBadge active={dish.is_active} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingDish(dish); setDishDrawer(true); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100" title="Edit">
                      <Pencil size={13} style={{ color: '#64748B' }} />
                    </button>
                    <button onClick={() => { setRecipeDish(dish); setRecipeDrawer(true); }}
                      className="p-1.5 rounded-lg hover:bg-blue-50" title="View/Edit Recipe">
                      <BookOpen size={13} style={{ color: '#3B82F6' }} />
                    </button>
                    <button onClick={() => toggleActive(dish)}
                      className="p-1.5 rounded-lg hover:bg-slate-100" title={dish.is_active ? 'Deactivate' : 'Activate'}>
                      {dish.is_active
                        ? <ToggleRight size={15} style={{ color: '#0D9488' }} />
                        : <ToggleLeft size={15} style={{ color: '#94A3B8' }} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DishDrawer open={dishDrawer} onClose={() => setDishDrawer(false)} editing={editingDish}
        onSaved={() => qc.invalidateQueries({ queryKey: ['dishes'] })} />
      <RecipeDrawer dish={recipeDish} open={recipeDrawer} onClose={() => setRecipeDrawer(false)}
        onSaved={() => qc.invalidateQueries({ queryKey: ['dishes'] })} />
    </div>
  );
}

// ─── Ingredients Tab ─────────────────────────────────────────────────────────

function IngredientsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);

  const qs = new URLSearchParams({
    ...(search ? { search } : {}),
    ...(category !== 'All' ? { category } : {}),
    page_size: '100',
  }).toString();

  const { data, isLoading } = useQuery({
    queryKey: ['ingredients', qs],
    queryFn: () => api.get(`/master/ingredients/?${qs}`),
  });

  const ingredients: Ingredient[] = data?.results ?? data ?? [];

  async function toggleActive(ing: Ingredient) {
    try {
      await api.patch(`/master/ingredients/${ing.id}/`, { is_active: !ing.is_active });
      toast.success(ing.is_active ? 'Ingredient deactivated' : 'Ingredient activated');
      qc.invalidateQueries({ queryKey: ['ingredients'] });
    } catch { toast.error('Failed to update'); }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[180px]"
          style={{ border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
          <Search size={14} style={{ color: '#94A3B8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ingredients…"
            className="bg-transparent outline-none text-sm flex-1" style={{ color: '#0F172A' }} />
          {search && <button onClick={() => setSearch('')}><X size={12} style={{ color: '#94A3B8' }} /></button>}
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none"
          style={{ border: '1.5px solid #E2E8F0', color: category !== 'All' ? '#0F172A' : '#94A3B8', backgroundColor: '#F8FAFC' }}>
          {ING_CATEGORIES.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
        </select>
        <button onClick={() => { setEditing(null); setDrawerOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white ml-auto"
          style={{ backgroundColor: '#D95F0E' }}>
          <Plus size={15} /> Add Ingredient
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E2E8F0', backgroundColor: '#fff' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {['Name', 'Category', 'Unit of Measure', 'Active', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#64748B' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  {Array.from({ length: 5 }).map((_, j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>)}
                </tr>
              ))
            ) : ingredients.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-14 text-center">
                <Package size={36} className="mx-auto mb-2 opacity-20" style={{ color: '#64748B' }} />
                <p className="text-sm" style={{ color: '#94A3B8' }}>No ingredients found</p>
              </td></tr>
            ) : ingredients.map(ing => (
              <tr key={ing.id} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td className="px-4 py-3 font-medium" style={{ color: '#0F172A' }}>{ing.name}</td>
                <td className="px-4 py-3">
                  {ing.category ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>{ing.category}</span>
                  ) : <span style={{ color: '#94A3B8' }}>—</span>}
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: '#64748B' }}>{ing.unit_of_measure}</td>
                <td className="px-4 py-3"><ActiveBadge active={ing.is_active} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditing(ing); setDrawerOpen(true); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100" title="Edit">
                      <Pencil size={13} style={{ color: '#64748B' }} />
                    </button>
                    <button onClick={() => toggleActive(ing)}
                      className="p-1.5 rounded-lg hover:bg-slate-100" title={ing.is_active ? 'Deactivate' : 'Activate'}>
                      {ing.is_active
                        ? <ToggleRight size={15} style={{ color: '#0D9488' }} />
                        : <ToggleLeft size={15} style={{ color: '#94A3B8' }} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <IngredientDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} editing={editing}
        onSaved={() => qc.invalidateQueries({ queryKey: ['ingredients'] })} />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'dishes' | 'ingredients';

export default function MasterPage() {
  const [tab, setTab] = useState<Tab>('dishes');

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#0F172A' }}>Master Data</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748B' }}>Manage dishes, recipes, and ingredients</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: '#E2E8F0' }}>
        {([
          { key: 'dishes', label: 'Dishes', icon: ChefHat },
          { key: 'ingredients', label: 'Ingredients', icon: Package },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors relative"
            style={{ color: tab === key ? '#D95F0E' : '#64748B' }}>
            <Icon size={15} />
            {label}
            {tab === key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full" style={{ backgroundColor: '#D95F0E' }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'dishes' ? <DishesTab /> : <IngredientsTab />}
    </div>
  );
}
