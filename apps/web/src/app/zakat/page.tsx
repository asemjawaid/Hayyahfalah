'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronRight, DollarSign, Scale, Info } from 'lucide-react';
import { BottomNav } from '@/components/ui/nav';
import {
  db,
  getZakatAssets, addZakatAsset, deleteZakatAsset,
  getZakatLiabilities, addZakatLiability, deleteZakatLiability,
  getZakatPayments, logZakatPayment,
  type ZakatAsset, type ZakatLiability, type ZakatPayment,
  type ZakatAssetCategory, type ZakatLiabilityCategory, type ZakatRecipientCategory,
} from '@/lib/db';
import { useUserStore } from '@/store/user-store';
import { cn } from '@/lib/utils';
import { toHijri } from '@/lib/hijri';

// Gold nisab: 87.48g × $60/g ≈ $5,249 | Silver: 612.36g × $0.85/g ≈ $520
// Using approximate current values — in production connect to live prices
const GOLD_PRICE_PER_GRAM = 95; // USD approx
const SILVER_PRICE_PER_GRAM = 1.1; // USD approx
const GOLD_NISAB_GRAMS = 87.48;
const SILVER_NISAB_GRAMS = 612.36;

const GOLD_NISAB_USD = GOLD_NISAB_GRAMS * GOLD_PRICE_PER_GRAM;
const SILVER_NISAB_USD = SILVER_NISAB_GRAMS * SILVER_PRICE_PER_GRAM;

const CATEGORY_LABELS: Record<ZakatAssetCategory, string> = {
  cash: 'Cash & Savings',
  gold: 'Gold',
  silver: 'Silver',
  stocks: 'Stocks & Equities',
  crypto: 'Cryptocurrency',
  business: 'Business Assets',
  receivables: 'Receivables (owed to me)',
  real_estate: 'Real Estate (for sale)',
  retirement: 'Retirement Accounts',
};

const LIABILITY_LABELS: Record<ZakatLiabilityCategory, string> = {
  mortgage: 'Mortgage',
  loan: 'Loan',
  credit_card: 'Credit Card',
  other: 'Other Debt',
};

const RECIPIENT_LABELS: Record<ZakatRecipientCategory, string> = {
  poor: 'Poor (Fuqara)',
  needy: 'Needy (Masakin)',
  collector: 'Zakat Collector',
  heart_inclined: 'Those whose hearts are inclined',
  freeing_captive: 'Freeing captives',
  debtor: 'Those in debt',
  in_path_of_allah: 'In the path of Allah',
  traveler: 'Stranded traveler',
};

type Section = 'overview' | 'assets' | 'liabilities' | 'payments' | 'add_asset' | 'add_liability' | 'add_payment';

export default function ZakatPage() {
  const [section, setSection] = useState<Section>('overview');
  const [assets, setAssets] = useState<ZakatAsset[]>([]);
  const [liabilities, setLiabilities] = useState<ZakatLiability[]>([]);
  const [payments, setPayments] = useState<ZakatPayment[]>([]);
  const { profile } = useUserStore();

  const load = useCallback(async () => {
    const [a, l, p] = await Promise.all([getZakatAssets(), getZakatLiabilities(), getZakatPayments()]);
    setAssets(a);
    setLiabilities(l);
    setPayments(p);
  }, []);

  useEffect(() => { load(); }, [load]);

  const nisabBasis = profile?.madhab === 'hanafi' ? 'silver' : 'gold';
  const nisabThreshold = nisabBasis === 'silver' ? SILVER_NISAB_USD : GOLD_NISAB_USD;

  const totalAssets = assets.reduce((s, a) => {
    if (a.category === 'gold' && a.weightGrams) return s + a.weightGrams * GOLD_PRICE_PER_GRAM;
    if (a.category === 'silver' && a.weightGrams) return s + a.weightGrams * SILVER_PRICE_PER_GRAM;
    return s + a.value;
  }, 0);

  const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);
  const netZakatable = Math.max(0, totalAssets - totalLiabilities);
  const zakatDue = netZakatable >= nisabThreshold;
  const zakatAmount = zakatDue ? netZakatable * 0.025 : 0;

  if (section === 'assets') return <AssetsSection assets={assets} onBack={() => { setSection('overview'); load(); }} onDelete={async (id) => { await deleteZakatAsset(id); load(); }} onAdd={() => setSection('add_asset')} />;
  if (section === 'liabilities') return <LiabilitiesSection liabilities={liabilities} onBack={() => { setSection('overview'); load(); }} onDelete={async (id) => { await deleteZakatLiability(id); load(); }} onAdd={() => setSection('add_liability')} />;
  if (section === 'payments') return <PaymentsSection payments={payments} onBack={() => { setSection('overview'); load(); }} onAdd={() => setSection('add_payment')} />;
  if (section === 'add_asset') return <AddAssetForm onBack={() => { setSection('assets'); load(); }} onSave={async (a) => { await addZakatAsset(a); setSection('assets'); load(); }} />;
  if (section === 'add_liability') return <AddLiabilityForm onBack={() => { setSection('liabilities'); load(); }} onSave={async (l) => { await addZakatLiability(l); setSection('liabilities'); load(); }} />;
  if (section === 'add_payment') return <AddPaymentForm onBack={() => { setSection('payments'); load(); }} onSave={async (p) => { await logZakatPayment(p); setSection('payments'); load(); }} zakatAmount={zakatAmount} />;

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--bg-secondary)]">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Zakat</h1>
          <p className="text-[var(--text-tertiary)] text-xs">2.5% on zakatable wealth held for one lunar year</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Summary card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-2xl p-5 space-y-3',
            zakatDue ? 'bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30' : 'bg-[var(--bg-secondary)]'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] text-sm">Net zakatable wealth</span>
            <span className="text-[var(--text-primary)] font-semibold text-lg">${netZakatable.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-tertiary)]">Nisab threshold ({nisabBasis})</span>
            <span className="text-[var(--text-secondary)]">${nisabThreshold.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="border-t border-[var(--bg-tertiary)] pt-3">
            {zakatDue ? (
              <div className="text-center">
                <div className="text-[var(--text-tertiary)] text-xs mb-1">Zakat due (2.5%)</div>
                <div className="text-[var(--accent-primary)] font-display text-3xl font-semibold">
                  ${zakatAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </div>
                <p className="text-[var(--text-tertiary)] text-xs mt-2">May Allah accept your zakat and bless your wealth.</p>
              </div>
            ) : (
              <div className="text-center text-[var(--text-tertiary)] text-sm">
                {assets.length === 0
                  ? 'Add your assets to calculate zakat'
                  : 'Wealth below nisab threshold — zakat not yet due'}
              </div>
            )}
          </div>
        </motion.div>

        {/* Nisab basis info */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-3 flex gap-2">
          <Info size={14} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
          <p className="text-[var(--text-tertiary)] text-xs">
            Using <strong className="text-[var(--text-secondary)]">{nisabBasis} nisab</strong> per your madhab ({nisabBasis === 'silver' ? 'Hanafi' : "Shafi'i/Maliki/Hanbali"}). Gold: ${GOLD_PRICE_PER_GRAM}/g · Silver: ${SILVER_PRICE_PER_GRAM}/g (approximate — verify current prices).
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Total Assets', `$${totalAssets.toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
            ['Liabilities', `$${totalLiabilities.toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
            ['Paid This Year', `$${payments.filter(p => new Date(p.paidDate).getFullYear() === new Date().getFullYear()).reduce((s, p) => s + p.amount, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`],
          ].map(([label, value]) => (
            <div key={label} className="bg-[var(--bg-secondary)] rounded-xl p-3">
              <div className="text-[var(--text-primary)] font-semibold text-sm">{value}</div>
              <div className="text-[var(--text-tertiary)] text-xs">{label}</div>
            </div>
          ))}
        </div>

        {/* Navigation sections */}
        {[
          { id: 'assets' as Section, label: 'Assets', desc: `${assets.length} item${assets.length !== 1 ? 's' : ''}` },
          { id: 'liabilities' as Section, label: 'Liabilities', desc: `${liabilities.length} item${liabilities.length !== 1 ? 's' : ''}` },
          { id: 'payments' as Section, label: 'Payment Record', desc: `${payments.length} payment${payments.length !== 1 ? 's' : ''}` },
        ].map(({ id, label, desc }) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className="w-full flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <div className="text-left">
              <div className="text-[var(--text-primary)] font-medium">{label}</div>
              <div className="text-[var(--text-tertiary)] text-xs">{desc}</div>
            </div>
            <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
          </button>
        ))}

        {zakatDue && (
          <button
            onClick={() => setSection('add_payment')}
            className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl"
          >
            Log Zakat Payment
          </button>
        )}

        <p className="text-[var(--text-tertiary)] text-xs text-center pb-2">
          Consult a scholar for complex asset situations. This app provides estimates only.
        </p>
      </div>
      <BottomNav />
    </div>
  );
}

function ZakatHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--bg-secondary)]">
      <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="text-[var(--accent-primary)]">← Back</button>
        <h2 className="font-display text-xl text-[var(--text-primary)]">{title}</h2>
      </div>
    </div>
  );
}

function AssetsSection({ assets, onBack, onDelete, onAdd }: { assets: ZakatAsset[]; onBack: () => void; onDelete: (id: string) => void; onAdd: () => void }) {
  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <ZakatHeader title="Assets" onBack={onBack} />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {assets.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-tertiary)]">
            <DollarSign size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No assets added yet</p>
          </div>
        ) : assets.map(a => (
          <div key={a.id} className="bg-[var(--bg-secondary)] rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[var(--text-primary)] font-medium text-sm">{a.label || CATEGORY_LABELS[a.category]}</div>
              <div className="text-[var(--text-tertiary)] text-xs">{CATEGORY_LABELS[a.category]}</div>
              {a.weightGrams && <div className="text-[var(--text-tertiary)] text-xs">{a.weightGrams}g</div>}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-[var(--accent-primary)] font-semibold">${a.value.toLocaleString()}</div>
              <button onClick={() => onDelete(a.id)} className="text-[var(--text-tertiary)] hover:text-rose-400 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        <button onClick={onAdd} className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl flex items-center justify-center gap-2">
          <Plus size={18} /> Add Asset
        </button>
      </div>
    </div>
  );
}

function LiabilitiesSection({ liabilities, onBack, onDelete, onAdd }: { liabilities: ZakatLiability[]; onBack: () => void; onDelete: (id: string) => void; onAdd: () => void }) {
  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <ZakatHeader title="Liabilities" onBack={onBack} />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        <p className="text-[var(--text-tertiary)] text-xs">Debts are subtracted from zakatable assets per most madhab rulings.</p>
        {liabilities.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-tertiary)]">
            <Scale size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No liabilities added</p>
          </div>
        ) : liabilities.map(l => (
          <div key={l.id} className="bg-[var(--bg-secondary)] rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-[var(--text-primary)] font-medium text-sm">{l.label || LIABILITY_LABELS[l.category]}</div>
              <div className="text-[var(--text-tertiary)] text-xs">{LIABILITY_LABELS[l.category]}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-rose-400 font-semibold">-${l.value.toLocaleString()}</div>
              <button onClick={() => onDelete(l.id)} className="text-[var(--text-tertiary)] hover:text-rose-400 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        <button onClick={onAdd} className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl flex items-center justify-center gap-2">
          <Plus size={18} /> Add Liability
        </button>
      </div>
    </div>
  );
}

function PaymentsSection({ payments, onBack, onAdd }: { payments: ZakatPayment[]; onBack: () => void; onAdd: () => void }) {
  const total = payments.reduce((s, p) => s + p.amount, 0);
  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <ZakatHeader title="Payment Record" onBack={onBack} />
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {payments.length > 0 && (
          <div className="bg-[var(--bg-secondary)] rounded-xl p-3 text-center">
            <div className="text-[var(--accent-primary)] font-semibold text-xl">${total.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
            <div className="text-[var(--text-tertiary)] text-xs">total zakat paid — may Allah accept 🤍</div>
          </div>
        )}
        {payments.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-tertiary)] text-sm">No payments recorded yet</div>
        ) : payments.map(p => (
          <div key={p.id} className="bg-[var(--bg-secondary)] rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-[var(--text-primary)] font-medium">${p.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
              <div className="text-[var(--text-tertiary)] text-xs">{p.paidDate}</div>
            </div>
            {p.recipientCategory && <div className="text-[var(--text-tertiary)] text-xs mt-1">{RECIPIENT_LABELS[p.recipientCategory]}</div>}
            {p.recipientNote && <div className="text-[var(--text-secondary)] text-xs mt-1">{p.recipientNote}</div>}
          </div>
        ))}
        <button onClick={onAdd} className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl flex items-center justify-center gap-2">
          <Plus size={18} /> Log Payment
        </button>
      </div>
    </div>
  );
}

function AddAssetForm({ onBack, onSave }: { onBack: () => void; onSave: (a: Omit<ZakatAsset, 'id' | 'addedAt'>) => void }) {
  const [category, setCategory] = useState<ZakatAssetCategory>('cash');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [weightGrams, setWeightGrams] = useState('');
  const [currency, setCurrency] = useState('USD');
  const isGoldSilver = category === 'gold' || category === 'silver';

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <ZakatHeader title="Add Asset" onBack={onBack} />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div>
          <label className="text-[var(--text-secondary)] text-sm mb-2 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(CATEGORY_LABELS) as [ZakatAssetCategory, string][]).map(([id, lbl]) => (
              <button key={id} onClick={() => setCategory(id)} className={cn('px-3 py-1.5 rounded-full text-xs transition-all', category === id ? 'bg-[var(--accent-primary)] text-[#0D1421]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]')}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[var(--text-secondary)] text-sm mb-1 block">Label (optional)</label>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder={CATEGORY_LABELS[category]} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
        </div>
        {isGoldSilver && (
          <div>
            <label className="text-[var(--text-secondary)] text-sm mb-1 block">Weight (grams)</label>
            <input type="number" value={weightGrams} onChange={e => setWeightGrams(e.target.value)} placeholder="0" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
            <p className="text-[var(--text-tertiary)] text-xs mt-1">
              Approx. value: ${((parseFloat(weightGrams) || 0) * (category === 'gold' ? GOLD_PRICE_PER_GRAM : SILVER_PRICE_PER_GRAM)).toFixed(2)}
            </p>
          </div>
        )}
        <div>
          <label className="text-[var(--text-secondary)] text-sm mb-1 block">Value (USD)</label>
          <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
        </div>
        <button
          disabled={!value || parseFloat(value) <= 0}
          onClick={() => onSave({ category, label: label || undefined, value: parseFloat(value), currency, weightGrams: weightGrams ? parseFloat(weightGrams) : undefined })}
          className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50"
        >
          Add Asset
        </button>
      </div>
    </div>
  );
}

function AddLiabilityForm({ onBack, onSave }: { onBack: () => void; onSave: (l: Omit<ZakatLiability, 'id'>) => void }) {
  const [category, setCategory] = useState<ZakatLiabilityCategory>('loan');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <ZakatHeader title="Add Liability" onBack={onBack} />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div>
          <label className="text-[var(--text-secondary)] text-sm mb-2 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(LIABILITY_LABELS) as [ZakatLiabilityCategory, string][]).map(([id, lbl]) => (
              <button key={id} onClick={() => setCategory(id)} className={cn('px-3 py-1.5 rounded-full text-xs transition-all', category === id ? 'bg-[var(--accent-primary)] text-[#0D1421]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]')}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[var(--text-secondary)] text-sm mb-1 block">Label (optional)</label>
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder={LIABILITY_LABELS[category]} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
        </div>
        <div>
          <label className="text-[var(--text-secondary)] text-sm mb-1 block">Amount (USD)</label>
          <input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0.00" className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
        </div>
        <button
          disabled={!value || parseFloat(value) <= 0}
          onClick={() => onSave({ category, label: label || undefined, value: parseFloat(value), currency: 'USD' })}
          className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50"
        >
          Add Liability
        </button>
      </div>
    </div>
  );
}

function AddPaymentForm({ onBack, onSave, zakatAmount }: { onBack: () => void; onSave: (p: Omit<ZakatPayment, 'id' | 'loggedAt'>) => void; zakatAmount: number }) {
  const today = new Date().toISOString().split('T')[0];
  const [paidDate, setPaidDate] = useState(today);
  const [amount, setAmount] = useState(zakatAmount.toFixed(2));
  const [recipient, setRecipient] = useState<ZakatRecipientCategory>('poor');
  const [note, setNote] = useState('');

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <ZakatHeader title="Log Payment" onBack={onBack} />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div>
          <label className="text-[var(--text-secondary)] text-sm mb-1 block">Date Paid</label>
          <input type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
        </div>
        <div>
          <label className="text-[var(--text-secondary)] text-sm mb-1 block">Amount (USD)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
        </div>
        <div>
          <label className="text-[var(--text-secondary)] text-sm mb-2 block">Recipient Category (Quran 9:60)</label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(RECIPIENT_LABELS) as [ZakatRecipientCategory, string][]).map(([id, lbl]) => (
              <button key={id} onClick={() => setRecipient(id)} className={cn('px-3 py-1.5 rounded-full text-xs transition-all', recipient === id ? 'bg-[var(--accent-primary)] text-[#0D1421]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]')}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[var(--text-secondary)] text-sm mb-1 block">Note (optional)</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Charity name, individual, etc." className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
        </div>
        <button
          disabled={!amount || parseFloat(amount) <= 0}
          onClick={() => onSave({ paidDate, amount: parseFloat(amount), currency: 'USD', recipientCategory: recipient, recipientNote: note || undefined })}
          className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50"
        >
          Record Payment
        </button>
      </div>
    </div>
  );
}
