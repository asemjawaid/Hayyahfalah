'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, ChevronRight, DollarSign, Scale, Info,
  Heart, Users, CheckCircle2, RefreshCw, Globe, X,
} from 'lucide-react';
import { BottomNav } from '@/components/ui/nav';
import {
  getZakatAssets, addZakatAsset, deleteZakatAsset,
  getZakatLiabilities, addZakatLiability, deleteZakatLiability,
  getZakatPayments, logZakatPayment,
  getSadaqaLogs, addSadaqaLog, deleteSadaqaLog,
  getMemberProfiles,
  getSetting, setSetting,
  type ZakatAsset, type ZakatLiability, type ZakatPayment,
  type ZakatAssetCategory, type ZakatLiabilityCategory, type ZakatRecipientCategory,
  type SadaqaLog, type SadaqaType,
} from '@/lib/db';
import { useUserStore } from '@/store/user-store';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────

const TROY_OZ_TO_G = 31.1034768;
const GOLD_NISAB_GRAMS = 87.48;
const SILVER_NISAB_GRAMS = 612.36;
const HAWL_DAYS = 354;

// Fallback prices (USD/g) — used if live fetch fails
const FALLBACK_GOLD_USD_PER_G = 104.0;   // ~$3,235/troy oz
const FALLBACK_SILVER_USD_PER_G = 1.05;  // ~$32.7/troy oz

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar',           flag: '🇺🇸' },
  { code: 'GBP', name: 'British Pound',       flag: '🇬🇧' },
  { code: 'EUR', name: 'Euro',                flag: '🇪🇺' },
  { code: 'AUD', name: 'Australian Dollar',   flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar',     flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc',         flag: '🇨🇭' },
  { code: 'SGD', name: 'Singapore Dollar',    flag: '🇸🇬' },
  { code: 'AED', name: 'UAE Dirham',          flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal',         flag: '🇸🇦' },
  { code: 'QAR', name: 'Qatari Riyal',        flag: '🇶🇦' },
  { code: 'KWD', name: 'Kuwaiti Dinar',       flag: '🇰🇼' },
  { code: 'BHD', name: 'Bahraini Dinar',      flag: '🇧🇭' },
  { code: 'OMR', name: 'Omani Rial',          flag: '🇴🇲' },
  { code: 'MYR', name: 'Malaysian Ringgit',   flag: '🇲🇾' },
  { code: 'IDR', name: 'Indonesian Rupiah',   flag: '🇮🇩' },
  { code: 'PKR', name: 'Pakistani Rupee',     flag: '🇵🇰' },
  { code: 'BDT', name: 'Bangladeshi Taka',    flag: '🇧🇩' },
  { code: 'INR', name: 'Indian Rupee',        flag: '🇮🇳' },
  { code: 'LKR', name: 'Sri Lankan Rupee',    flag: '🇱🇰' },
  { code: 'NGN', name: 'Nigerian Naira',      flag: '🇳🇬' },
  { code: 'EGP', name: 'Egyptian Pound',      flag: '🇪🇬' },
  { code: 'TRY', name: 'Turkish Lira',        flag: '🇹🇷' },
  { code: 'ZAR', name: 'South African Rand',  flag: '🇿🇦' },
  { code: 'MAD', name: 'Moroccan Dirham',     flag: '🇲🇦' },
  { code: 'TND', name: 'Tunisian Dinar',      flag: '🇹🇳' },
  { code: 'JPY', name: 'Japanese Yen',        flag: '🇯🇵' },
];

const CATEGORY_LABELS: Record<ZakatAssetCategory, string> = {
  cash: 'Cash & Savings', gold: 'Gold', silver: 'Silver',
  stocks: 'Stocks & Equities', crypto: 'Cryptocurrency',
  business: 'Business Assets', receivables: 'Receivables',
  real_estate: 'Real Estate (for sale)', retirement: 'Retirement Accounts',
};
const CATEGORY_EMOJI: Record<ZakatAssetCategory, string> = {
  cash: '💵', gold: '🏅', silver: '🪙', stocks: '📈', crypto: '₿',
  business: '🏢', receivables: '📄', real_estate: '🏠', retirement: '🏦',
};
const LIABILITY_LABELS: Record<ZakatLiabilityCategory, string> = {
  mortgage: 'Mortgage', loan: 'Loan', credit_card: 'Credit Card', other: 'Other Debt',
};
const RECIPIENT_LABELS: Record<ZakatRecipientCategory, string> = {
  poor: 'Poor (Fuqara)', needy: 'Needy (Masakin)', collector: 'Zakat Collector',
  heart_inclined: 'Those whose hearts are inclined', freeing_captive: 'Freeing captives',
  debtor: 'Those in debt', in_path_of_allah: 'In the path of Allah', traveler: 'Stranded traveler',
};
const SADAQA_TYPE_LABELS: Record<SadaqaType, string> = {
  sadaqa: 'Sadaqa', kaffarah: 'Kaffarah', fidya: 'Fidya',
  nafl: 'Nafl', infaq: 'Infaq', sadaqa_jariyah: 'Sadaqa Jariyah',
};
const SADAQA_TYPE_EMOJI: Record<SadaqaType, string> = {
  sadaqa: '🤲', kaffarah: '⚖️', fidya: '🌿', nafl: '✨', infaq: '🫙', sadaqa_jariyah: '🌱',
};
const SADAQA_TYPE_DESC: Record<SadaqaType, string> = {
  sadaqa: 'Voluntary charity — any amount, any time.',
  kaffarah: 'Expiation for broken oaths, missed fasts, etc.',
  fidya: 'Ransom for missed fasts due to illness or old age.',
  nafl: 'Supererogatory act of worship.',
  infaq: 'Spending in the way of Allah (family, community).',
  sadaqa_jariyah: 'Ongoing charity — rewards continue after death.',
};

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'zakat' | 'sadaqa' | 'fitrana';
type SubView =
  | 'main' | 'zakat_assets' | 'zakat_liabilities' | 'zakat_payments'
  | 'add_asset' | 'add_liability' | 'add_payment' | 'add_sadaqa';

interface MetalPrices {
  goldPerGram: number;
  silverPerGram: number;
  live: boolean;
  updatedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMoney(n: number, currency: string, maxDecimals = 0): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: maxDecimals,
      minimumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n.toFixed(maxDecimals)}`;
  }
}

function daysHeld(addedAt: string): number {
  return Math.floor((Date.now() - new Date(addedAt).getTime()) / 86_400_000);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function fetchLivePrices(targetCurrency: string): Promise<MetalPrices> {
  const fallback: MetalPrices = {
    goldPerGram: FALLBACK_GOLD_USD_PER_G,
    silverPerGram: FALLBACK_SILVER_USD_PER_G,
    live: false,
    updatedAt: '',
  };

  try {
    // Fetch metal spot prices (USD/troy oz) and exchange rates in parallel
    const [metalsResult, ratesResult] = await Promise.allSettled([
      fetch('https://metals.live/api/spot', { cache: 'no-store' }),
      fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' }),
    ]);

    let goldUsdPerGram = FALLBACK_GOLD_USD_PER_G;
    let silverUsdPerGram = FALLBACK_SILVER_USD_PER_G;
    let metalsLive = false;

    if (metalsResult.status === 'fulfilled' && metalsResult.value.ok) {
      const data = await metalsResult.value.json();
      const m = Array.isArray(data) ? data[0] : data;
      if (typeof m?.gold === 'number' && m.gold > 0) {
        goldUsdPerGram = m.gold / TROY_OZ_TO_G;
        metalsLive = true;
      }
      if (typeof m?.silver === 'number' && m.silver > 0) {
        silverUsdPerGram = m.silver / TROY_OZ_TO_G;
      }
    }

    // Convert USD prices to target currency
    let rate = 1;
    if (targetCurrency !== 'USD' && ratesResult.status === 'fulfilled' && ratesResult.value.ok) {
      const rateData = await ratesResult.value.json();
      rate = rateData?.rates?.[targetCurrency] ?? 1;
    }

    return {
      goldPerGram: goldUsdPerGram * rate,
      silverPerGram: silverUsdPerGram * rate,
      live: metalsLive,
      updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    return fallback;
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function GivingPage() {
  const [tab, setTab] = useState<Tab>('zakat');
  const [view, setView] = useState<SubView>('main');

  const [assets, setAssets] = useState<ZakatAsset[]>([]);
  const [liabilities, setLiabilities] = useState<ZakatLiability[]>([]);
  const [payments, setPayments] = useState<ZakatPayment[]>([]);
  const [sadaqaLogs, setSadaqaLogs] = useState<SadaqaLog[]>([]);
  const [familyCount, setFamilyCount] = useState(1);
  const [fitranaRate, setFitranaRate] = useState(15);
  const [fitranaPaidYear, setFitranaPaidYear] = useState<number | null>(null);
  const [fitranaCustomCount, setFitranaCustomCount] = useState<number | null>(null);

  // Currency & prices
  const [currency, setCurrency] = useState('USD');
  const [prices, setPrices] = useState<MetalPrices>({
    goldPerGram: FALLBACK_GOLD_USD_PER_G,
    silverPerGram: FALLBACK_SILVER_USD_PER_G,
    live: false,
    updatedAt: '',
  });
  const [pricesLoading, setPricesLoading] = useState(true);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const { profile } = useUserStore();

  // Load DB data
  const load = useCallback(async () => {
    const [a, l, p, s, members] = await Promise.all([
      getZakatAssets(), getZakatLiabilities(), getZakatPayments(),
      getSadaqaLogs(), getMemberProfiles(),
    ]);
    setAssets(a); setLiabilities(l); setPayments(p); setSadaqaLogs(s);
    setFamilyCount(members.length + 1);

    const [rate, paidYear, customCount, savedCurrency] = await Promise.all([
      getSetting('fitrana_rate'), getSetting('fitrana_paid_year'),
      getSetting('fitrana_custom_count'), getSetting('giving_currency'),
    ]);
    if (rate) setFitranaRate(parseFloat(rate));
    if (paidYear) setFitranaPaidYear(parseInt(paidYear));
    if (customCount) setFitranaCustomCount(parseInt(customCount));
    if (savedCurrency) setCurrency(savedCurrency);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Fetch live prices whenever currency changes
  const loadPrices = useCallback(async (cur: string) => {
    setPricesLoading(true);
    const p = await fetchLivePrices(cur);
    setPrices(p);
    setPricesLoading(false);
  }, []);

  useEffect(() => { loadPrices(currency); }, [currency, loadPrices]);

  const changeCurrency = async (code: string) => {
    setCurrency(code);
    await setSetting('giving_currency', code);
    setShowCurrencyPicker(false);
  };

  // ── Zakat calcs ──────────────────────────────────────────────────────────────
  const nisabBasis = profile?.madhab === 'hanafi' ? 'silver' : 'gold';
  const nisabThreshold = nisabBasis === 'silver'
    ? SILVER_NISAB_GRAMS * prices.silverPerGram
    : GOLD_NISAB_GRAMS * prices.goldPerGram;

  function assetValue(a: ZakatAsset): number {
    if (a.category === 'gold' && a.weightGrams) return a.weightGrams * prices.goldPerGram;
    if (a.category === 'silver' && a.weightGrams) return a.weightGrams * prices.silverPerGram;
    return a.value;
  }

  const totalAssets = assets.reduce((s, a) => s + assetValue(a), 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0);
  const netZakatable = Math.max(0, totalAssets - totalLiabilities);
  const zakatDue = netZakatable >= nisabThreshold;
  const zakatAmount = zakatDue ? netZakatable * 0.025 : 0;

  // ── Sadaqa calcs ─────────────────────────────────────────────────────────────
  const thisYear = new Date().getFullYear();
  const sadaqaThisYear = sadaqaLogs
    .filter(l => new Date(l.date).getFullYear() === thisYear)
    .reduce((s, l) => s + l.amount, 0);

  // ── Fitrana ──────────────────────────────────────────────────────────────────
  const headCount = fitranaCustomCount ?? familyCount;
  const fitranaTotal = fitranaRate * headCount;
  const fitranaPaidThisYear = fitranaPaidYear === thisYear;

  // ── Currency info ─────────────────────────────────────────────────────────────
  const currencyInfo = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[0];

  // ── Sub-view routing ─────────────────────────────────────────────────────────
  const back = () => setView('main');

  if (view === 'zakat_assets') return (
    <SubScreen title="Assets" onBack={back}>
      <AssetsSection assets={assets} currency={currency} prices={prices}
        onDelete={async (id) => { await deleteZakatAsset(id); await load(); }}
        onAdd={() => setView('add_asset')} />
    </SubScreen>
  );
  if (view === 'zakat_liabilities') return (
    <SubScreen title="Liabilities" onBack={back}>
      <LiabilitiesSection liabilities={liabilities} currency={currency}
        onDelete={async (id) => { await deleteZakatLiability(id); await load(); }}
        onAdd={() => setView('add_liability')} />
    </SubScreen>
  );
  if (view === 'zakat_payments') return (
    <SubScreen title="Payment Record" onBack={back}>
      <PaymentsSection payments={payments} currency={currency} onAdd={() => setView('add_payment')} />
    </SubScreen>
  );
  if (view === 'add_asset') return (
    <SubScreen title="Add Asset" onBack={() => setView('zakat_assets')}>
      <AddAssetForm currency={currency} prices={prices}
        onSave={async (a) => { await addZakatAsset(a); await load(); setView('zakat_assets'); }} />
    </SubScreen>
  );
  if (view === 'add_liability') return (
    <SubScreen title="Add Liability" onBack={() => setView('zakat_liabilities')}>
      <AddLiabilityForm currency={currency}
        onSave={async (l) => { await addZakatLiability(l); await load(); setView('zakat_liabilities'); }} />
    </SubScreen>
  );
  if (view === 'add_payment') return (
    <SubScreen title="Log Zakat Payment" onBack={() => setView('zakat_payments')}>
      <AddPaymentForm zakatAmount={zakatAmount} currency={currency}
        onSave={async (p) => { await logZakatPayment(p); await load(); setView('zakat_payments'); }} />
    </SubScreen>
  );
  if (view === 'add_sadaqa') return (
    <SubScreen title="Log Sadaqa" onBack={back}>
      <AddSadaqaForm currency={currency}
        onSave={async (s) => { await addSadaqaLog(s); await load(); back(); }} />
    </SubScreen>
  );

  // ── Main view ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      {/* Currency Picker Modal */}
      <AnimatePresence>
        {showCurrencyPicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowCurrencyPicker(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-secondary)] rounded-t-2xl max-h-[75vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--bg-tertiary)]">
                <span className="font-display text-lg text-[var(--text-primary)]">Select Currency</span>
                <button onClick={() => setShowCurrencyPicker(false)} className="text-[var(--text-tertiary)]">
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto flex-1">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => changeCurrency(c.code)}
                    className={cn(
                      'w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--bg-tertiary)] transition-colors',
                      c.code === currency && 'bg-[var(--accent-primary)]/10'
                    )}
                  >
                    <span className="text-xl">{c.flag}</span>
                    <div className="flex-1 text-left">
                      <span className="text-[var(--text-primary)] text-sm font-medium">{c.code}</span>
                      <span className="text-[var(--text-tertiary)] text-xs ml-2">{c.name}</span>
                    </div>
                    {c.code === currency && <CheckCircle2 size={16} className="text-[var(--accent-primary)]" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--bg-secondary)]">
        <div className="max-w-lg mx-auto px-4 pt-5 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart size={20} className="text-[var(--accent-primary)]" />
              <h1 className="font-display text-2xl text-[var(--text-primary)]">Giving</h1>
            </div>
            {/* Currency button */}
            <button
              onClick={() => setShowCurrencyPicker(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-secondary)] rounded-full text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <span>{currencyInfo.flag}</span>
              <span>{currency}</span>
              <Globe size={12} className="text-[var(--text-tertiary)]" />
            </button>
          </div>
          {/* Price status bar */}
          {tab === 'zakat' && (
            <div className="flex items-center gap-1.5 mb-2 text-[10px]">
              {pricesLoading ? (
                <span className="text-[var(--text-tertiary)]">Fetching live prices…</span>
              ) : prices.live ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-green-400">Live prices</span>
                  <span className="text-[var(--text-tertiary)]">· Gold {fmtMoney(prices.goldPerGram, currency, 2)}/g · Silver {fmtMoney(prices.silverPerGram, currency, 3)}/g · updated {prices.updatedAt}</span>
                  <button onClick={() => loadPrices(currency)} className="ml-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                    <RefreshCw size={10} />
                  </button>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-amber-400">Estimated prices</span>
                  <span className="text-[var(--text-tertiary)]">· Gold {fmtMoney(prices.goldPerGram, currency, 2)}/g · Silver {fmtMoney(prices.silverPerGram, currency, 3)}/g</span>
                  <button onClick={() => loadPrices(currency)} className="ml-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                    <RefreshCw size={10} />
                  </button>
                </>
              )}
            </div>
          )}
          {/* Tabs */}
          <div className="flex">
            {(['zakat', 'sadaqa', 'fitrana'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn(
                  'flex-1 pb-3 text-sm font-medium border-b-2 transition-colors',
                  tab === t
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                    : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                )}
              >
                {t === 'fitrana' ? 'Fitrana' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
        <AnimatePresence mode="wait">
          {tab === 'zakat' && (
            <motion.div key="zakat" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-4">
              <ZakatTab
                assets={assets} currency={currency} prices={prices}
                netZakatable={netZakatable} nisabThreshold={nisabThreshold} nisabBasis={nisabBasis}
                zakatDue={zakatDue} zakatAmount={zakatAmount}
                totalAssets={totalAssets} totalLiabilities={totalLiabilities} payments={payments}
                onViewAssets={() => setView('zakat_assets')}
                onViewLiabilities={() => setView('zakat_liabilities')}
                onViewPayments={() => setView('zakat_payments')}
                onLogPayment={() => setView('add_payment')}
              />
            </motion.div>
          )}
          {tab === 'sadaqa' && (
            <motion.div key="sadaqa" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-4">
              <SadaqaTab logs={sadaqaLogs} sadaqaThisYear={sadaqaThisYear} currency={currency}
                onAdd={() => setView('add_sadaqa')}
                onDelete={async (id) => { await deleteSadaqaLog(id); await load(); }} />
            </motion.div>
          )}
          {tab === 'fitrana' && (
            <motion.div key="fitrana" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-4">
              <FitranaTab
                headCount={headCount} familyCount={familyCount}
                fitranaCustomCount={fitranaCustomCount} fitranaRate={fitranaRate}
                fitranaTotal={fitranaTotal} fitranaPaidThisYear={fitranaPaidThisYear}
                thisYear={thisYear} currency={currency}
                onRateChange={async (r) => { setFitranaRate(r); await setSetting('fitrana_rate', String(r)); }}
                onCountChange={async (c) => { setFitranaCustomCount(c); await setSetting('fitrana_custom_count', String(c)); }}
                onMarkPaid={async () => { setFitranaPaidYear(thisYear); await setSetting('fitrana_paid_year', String(thisYear)); }}
                onMarkUnpaid={async () => { setFitranaPaidYear(null); await setSetting('fitrana_paid_year', ''); }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
}

// ── Zakat Tab ─────────────────────────────────────────────────────────────────

function ZakatTab({
  assets, currency, prices,
  netZakatable, nisabThreshold, nisabBasis, zakatDue, zakatAmount,
  totalAssets, totalLiabilities, payments,
  onViewAssets, onViewLiabilities, onViewPayments, onLogPayment,
}: {
  assets: ZakatAsset[]; currency: string; prices: MetalPrices;
  netZakatable: number; nisabThreshold: number; nisabBasis: string;
  zakatDue: boolean; zakatAmount: number; totalAssets: number; totalLiabilities: number;
  payments: ZakatPayment[];
  onViewAssets: () => void; onViewLiabilities: () => void;
  onViewPayments: () => void; onLogPayment: () => void;
}) {
  const thisYear = new Date().getFullYear();
  const paidThisYear = payments
    .filter(p => new Date(p.paidDate).getFullYear() === thisYear)
    .reduce((s, p) => s + p.amount, 0);

  return (
    <>
      {/* Summary card */}
      <div className={cn('rounded-2xl p-5 space-y-3', zakatDue ? 'bg-[var(--accent-primary)]/15 border border-[var(--accent-primary)]/30' : 'bg-[var(--bg-secondary)]')}>
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-secondary)] text-sm">Net zakatable wealth</span>
          <span className="text-[var(--text-primary)] font-semibold text-lg">{fmtMoney(netZakatable, currency)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-tertiary)]">Nisab ({nisabBasis})</span>
          <span className="text-[var(--text-secondary)]">{fmtMoney(nisabThreshold, currency)}</span>
        </div>
        {/* Nisab progress bar */}
        <div className="space-y-1">
          <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', zakatDue ? 'bg-[var(--accent-primary)]' : 'bg-[var(--text-tertiary)]')}
              style={{ width: `${Math.min((netZakatable / nisabThreshold) * 100, 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-[var(--text-tertiary)]">
            {zakatDue ? 'Above nisab' : `${Math.round((netZakatable / nisabThreshold) * 100)}% of nisab`}
          </div>
        </div>
        <div className="border-t border-[var(--bg-tertiary)] pt-3">
          {zakatDue ? (
            <div className="text-center">
              <div className="text-[var(--text-tertiary)] text-xs mb-1">Zakat due (2.5%)</div>
              <div className="text-[var(--accent-primary)] font-display text-3xl font-semibold">{fmtMoney(zakatAmount, currency, 2)}</div>
              <p className="text-[var(--text-tertiary)] text-xs mt-2">May Allah accept your zakat and bless your wealth.</p>
            </div>
          ) : (
            <div className="text-center text-[var(--text-tertiary)] text-sm">
              {assets.length === 0 ? 'Add your assets to calculate zakat' : 'Wealth below nisab — zakat not yet due'}
            </div>
          )}
        </div>
      </div>

      {/* Nisab basis info */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-3 flex gap-2">
        <Info size={14} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
        <p className="text-[var(--text-tertiary)] text-xs leading-relaxed">
          <strong className="text-[var(--text-secondary)]">{nisabBasis === 'silver' ? 'Hanafi (silver nisab)' : "Shafi'i/Maliki/Hanbali (gold nisab)"}</strong>
          {' '}· Gold {fmtMoney(prices.goldPerGram, currency, 2)}/g · Silver {fmtMoney(prices.silverPerGram, currency, 3)}/g ·{' '}
          <span className={prices.live ? 'text-green-400' : 'text-amber-400'}>{prices.live ? 'live prices' : 'estimated'}</span>
        </p>
      </div>

      {/* Assets with hawl */}
      <div className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <span className="text-[var(--text-primary)] font-medium text-sm">Assets</span>
          <button onClick={onViewAssets} className="text-[var(--accent-primary)] text-xs flex items-center gap-1">
            {assets.length > 0 ? `View all ${assets.length}` : 'Add asset'} <ChevronRight size={12} />
          </button>
        </div>
        {assets.length === 0 ? (
          <div className="px-4 pb-4 text-[var(--text-tertiary)] text-xs">No assets yet — tap to add</div>
        ) : (
          <div className="divide-y divide-[var(--bg-tertiary)]">
            {assets.slice(0, 4).map(a => {
              const val = a.category === 'gold' && a.weightGrams ? a.weightGrams * prices.goldPerGram
                : a.category === 'silver' && a.weightGrams ? a.weightGrams * prices.silverPerGram
                : a.value;
              return <HawlAssetRow key={a.id} asset={a} displayValue={val} currency={currency} />;
            })}
            {assets.length > 4 && (
              <button onClick={onViewAssets} className="w-full py-3 text-[var(--accent-primary)] text-xs text-center">
                +{assets.length - 4} more assets
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ['Liabilities', fmtMoney(totalLiabilities, currency)],
          [`Paid ${new Date().getFullYear()}`, fmtMoney(paidThisYear, currency, 2)],
          ['Payments', `${payments.length}`],
        ].map(([label, value]) => (
          <div key={label} className="bg-[var(--bg-secondary)] rounded-xl p-3">
            <div className="text-[var(--text-primary)] font-semibold text-sm">{value}</div>
            <div className="text-[var(--text-tertiary)] text-[10px]">{label}</div>
          </div>
        ))}
      </div>

      {[
        { label: 'Liabilities', desc: totalLiabilities > 0 ? fmtMoney(totalLiabilities, currency) : 'None', action: onViewLiabilities },
        { label: 'Payment Record', desc: `${payments.length} payment${payments.length !== 1 ? 's' : ''}`, action: onViewPayments },
      ].map(({ label, desc, action }) => (
        <button key={label} onClick={action} className="w-full flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
          <div className="text-left">
            <div className="text-[var(--text-primary)] font-medium text-sm">{label}</div>
            <div className="text-[var(--text-tertiary)] text-xs">{desc}</div>
          </div>
          <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
        </button>
      ))}

      {zakatDue && (
        <button onClick={onLogPayment} className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl">
          Log Zakat Payment
        </button>
      )}
      <p className="text-[var(--text-tertiary)] text-xs text-center pb-2">
        Consult a scholar for complex situations. Gold/silver prices refresh from live market data.
      </p>
    </>
  );
}

function HawlAssetRow({ asset, displayValue, currency }: { asset: ZakatAsset; displayValue: number; currency: string }) {
  const days = daysHeld(asset.addedAt);
  const progress = Math.min(days / HAWL_DAYS, 1);
  const complete = days >= HAWL_DAYS;

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{CATEGORY_EMOJI[asset.category]}</span>
          <div>
            <div className="text-[var(--text-primary)] text-sm font-medium">{asset.label || CATEGORY_LABELS[asset.category]}</div>
            <div className="text-[var(--text-tertiary)] text-xs">{days}d held</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[var(--accent-primary)] font-semibold text-sm">{fmtMoney(displayValue, currency)}</div>
          <div className={cn('text-[10px] font-medium', complete ? 'text-green-400' : 'text-amber-400')}>
            {complete ? '✓ Hawl done' : `${Math.max(0, HAWL_DAYS - days)}d left`}
          </div>
        </div>
      </div>
      <div className="h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', complete ? 'bg-green-400' : 'bg-[var(--accent-primary)]')}
          style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

// ── Sadaqa Tab ────────────────────────────────────────────────────────────────

function SadaqaTab({ logs, sadaqaThisYear, currency, onAdd, onDelete }: {
  logs: SadaqaLog[]; sadaqaThisYear: number; currency: string;
  onAdd: () => void; onDelete: (id: string) => void;
}) {
  const thisYear = new Date().getFullYear();
  const allTime = logs.reduce((s, l) => s + l.amount, 0);
  const byType = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.type] = (acc[l.type] ?? 0) + l.amount; return acc;
  }, {});

  return (
    <>
      <div className="rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 p-5 text-center">
        <div className="text-[var(--text-tertiary)] text-xs mb-1">Given in {thisYear}</div>
        <div className="text-[var(--accent-primary)] font-display text-3xl font-semibold">{fmtMoney(sadaqaThisYear, currency, 2)}</div>
        {logs.length > 0 && (
          <div className="text-[var(--text-tertiary)] text-xs mt-2">
            {fmtMoney(allTime, currency, 2)} all time · {logs.length} entr{logs.length !== 1 ? 'ies' : 'y'}
          </div>
        )}
        <p className="text-[var(--text-tertiary)] text-xs mt-3 italic leading-relaxed">
          "The believer's shade on the Day of Resurrection will be his charity." — Tirmidhi
        </p>
      </div>

      {Object.keys(byType).length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(byType) as [SadaqaType, number][]).map(([type, amount]) => (
            <div key={type} className="bg-[var(--bg-secondary)] rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{SADAQA_TYPE_EMOJI[type]}</div>
              <div className="text-[var(--text-primary)] font-medium text-xs">{fmtMoney(amount, currency)}</div>
              <div className="text-[var(--text-tertiary)] text-[10px]">{SADAQA_TYPE_LABELS[type]}</div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {logs.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-tertiary)]">
            <Heart size={28} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No sadaqa logged yet</p>
            <p className="text-xs mt-1">Start logging your voluntary charity</p>
          </div>
        ) : logs.map(l => (
          <div key={l.id} className="bg-[var(--bg-secondary)] rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{SADAQA_TYPE_EMOJI[l.type]}</span>
              <div>
                <div className="text-[var(--text-primary)] font-medium text-sm">{fmtMoney(l.amount, l.currency || currency, 2)}</div>
                <div className="text-[var(--text-tertiary)] text-xs">{SADAQA_TYPE_LABELS[l.type]} · {fmtDate(l.date)}</div>
                {l.recipient && <div className="text-[var(--text-secondary)] text-xs">{l.recipient}</div>}
                {l.note && <div className="text-[var(--text-tertiary)] text-xs italic">{l.note}</div>}
              </div>
            </div>
            <button onClick={() => onDelete(l.id)} className="text-[var(--text-tertiary)] hover:text-rose-400 transition-colors p-1">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={onAdd} className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl flex items-center justify-center gap-2">
        <Plus size={18} /> Log Sadaqa
      </button>
    </>
  );
}

// ── Fitrana Tab ───────────────────────────────────────────────────────────────

function FitranaTab({
  headCount, familyCount, fitranaCustomCount, fitranaRate, fitranaTotal,
  fitranaPaidThisYear, thisYear, currency,
  onRateChange, onCountChange, onMarkPaid, onMarkUnpaid,
}: {
  headCount: number; familyCount: number; fitranaCustomCount: number | null;
  fitranaRate: number; fitranaTotal: number; fitranaPaidThisYear: boolean;
  thisYear: number; currency: string;
  onRateChange: (r: number) => void; onCountChange: (c: number) => void;
  onMarkPaid: () => void; onMarkUnpaid: () => void;
}) {
  const [rateInput, setRateInput] = useState(String(fitranaRate));

  // Suggested rates per currency (approximate per-person fitrana in local currency)
  const suggestedRates: Record<string, number[]> = {
    USD: [10, 15, 20, 25], GBP: [8, 12, 15, 20], EUR: [9, 13, 18, 23],
    AUD: [15, 20, 25, 30], CAD: [13, 18, 22, 28], SGD: [13, 18, 23, 28],
    AED: [37, 55, 74, 92], SAR: [38, 56, 75, 94], MYR: [47, 70, 93, 116],
    PKR: [2800, 4200, 5600, 7000], BDT: [1100, 1650, 2200, 2750],
    INR: [840, 1250, 1670, 2090], IDR: [155000, 232000, 310000, 387000],
    NGN: [8000, 12000, 16000, 20000], EGP: [500, 750, 1000, 1250],
    TRY: [320, 480, 640, 800], KWD: [3, 5, 6, 8],
  };
  const rates = suggestedRates[currency] ?? suggestedRates.USD;

  return (
    <>
      <div className={cn('rounded-2xl p-5 space-y-3', fitranaPaidThisYear ? 'bg-green-400/10 border border-green-400/30' : 'bg-[var(--bg-secondary)]')}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[var(--text-primary)] font-semibold text-lg">Zakat al-Fitr {thisYear}</div>
            <div className="text-[var(--text-tertiary)] text-xs">Due before Eid al-Fitr prayer</div>
          </div>
          {fitranaPaidThisYear && (
            <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
              <CheckCircle2 size={18} /> Paid
            </div>
          )}
        </div>
        <div className="border-t border-[var(--bg-tertiary)] pt-3 text-center">
          <div className="text-[var(--text-tertiary)] text-xs mb-1">Total due</div>
          <div className={cn('font-display text-4xl font-semibold', fitranaPaidThisYear ? 'text-green-400' : 'text-[var(--accent-primary)]')}>
            {fmtMoney(fitranaTotal, currency, 2)}
          </div>
          <div className="text-[var(--text-tertiary)] text-xs mt-1">
            {fmtMoney(fitranaRate, currency, 2)} × {headCount} {headCount === 1 ? 'person' : 'people'}
          </div>
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 space-y-3">
        <label className="text-[var(--text-secondary)] text-sm font-medium block">Rate per person ({currency})</label>
        <div className="grid grid-cols-4 gap-2">
          {rates.map(r => (
            <button key={r} onClick={() => { setRateInput(String(r)); onRateChange(r); }}
              className={cn('py-2 rounded-lg text-xs font-medium transition-colors', fitranaRate === r ? 'bg-[var(--accent-primary)] text-[#0D1421]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]')}>
              {fmtMoney(r, currency)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-tertiary)] text-xs shrink-0">Custom:</span>
          <input
            type="number" value={rateInput}
            onChange={e => setRateInput(e.target.value)}
            onBlur={() => { const v = parseFloat(rateInput); if (v > 0) onRateChange(v); }}
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm focus:outline-none"
            placeholder="Amount"
          />
        </div>
        <p className="text-[var(--text-tertiary)] text-xs">Equivalent to ~2.5 kg of staple food (rice, wheat). Verify with your local scholar or mosque.</p>
      </div>

      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[var(--text-secondary)] text-sm font-medium">People in household</label>
          <Users size={16} className="text-[var(--text-tertiary)]" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onCountChange(Math.max(1, headCount - 1))}
            className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xl font-semibold flex items-center justify-center">−</button>
          <div className="flex-1 text-center text-[var(--text-primary)] text-2xl font-semibold">{headCount}</div>
          <button onClick={() => onCountChange(headCount + 1)}
            className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xl font-semibold flex items-center justify-center">+</button>
        </div>
        <p className="text-[var(--text-tertiary)] text-xs">Auto-detected from family profiles ({familyCount} person{familyCount !== 1 ? 's' : ''}). Adjust if needed.</p>
      </div>

      {fitranaPaidThisYear ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 justify-center text-green-400 text-sm font-medium p-3 bg-green-400/10 rounded-xl border border-green-400/20">
            <CheckCircle2 size={18} /> Fitrana paid for {thisYear} — may Allah accept 🤍
          </div>
          <button onClick={onMarkUnpaid} className="w-full py-2 text-[var(--text-tertiary)] text-xs underline">Mark as unpaid</button>
        </div>
      ) : (
        <button onClick={onMarkPaid} className="w-full py-3.5 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl flex items-center justify-center gap-2">
          <CheckCircle2 size={18} /> Mark Fitrana as Paid
        </button>
      )}

      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-xs text-[var(--text-tertiary)] leading-relaxed space-y-2">
        <p><strong className="text-[var(--text-secondary)]">What is Zakat al-Fitr?</strong> An obligatory charity due at the end of Ramadan, before the Eid prayer. It purifies the fast and feeds the needy.</p>
        <p>Obligatory on every Muslim who has food in excess of their needs. You pay on behalf of yourself and all dependants under your care.</p>
      </div>
    </>
  );
}

// ── Shared Sub-Screen Wrapper ─────────────────────────────────────────────────

function SubScreen({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--bg-secondary)]">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="text-[var(--accent-primary)] text-sm">← Back</button>
          <h2 className="font-display text-xl text-[var(--text-primary)]">{title}</h2>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">{children}</div>
      <BottomNav />
    </div>
  );
}

// ── Assets Section ─────────────────────────────────────────────────────────────

function AssetsSection({ assets, currency, prices, onDelete, onAdd }: {
  assets: ZakatAsset[]; currency: string; prices: MetalPrices;
  onDelete: (id: string) => void; onAdd: () => void;
}) {
  return (
    <>
      <p className="text-[var(--text-tertiary)] text-xs">Hawl = 354-day lunar year. Asset must be held for one full hawl before zakat is due on it.</p>
      {assets.length === 0 ? (
        <div className="text-center py-10 text-[var(--text-tertiary)]">
          <DollarSign size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No assets added yet</p>
        </div>
      ) : assets.map(a => {
        const val = a.category === 'gold' && a.weightGrams ? a.weightGrams * prices.goldPerGram
          : a.category === 'silver' && a.weightGrams ? a.weightGrams * prices.silverPerGram
          : a.value;
        const days = daysHeld(a.addedAt);
        const complete = days >= HAWL_DAYS;
        const progress = Math.min(days / HAWL_DAYS, 1);
        return (
          <div key={a.id} className="bg-[var(--bg-secondary)] rounded-xl p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{CATEGORY_EMOJI[a.category]}</span>
                <div>
                  <div className="text-[var(--text-primary)] font-medium text-sm">{a.label || CATEGORY_LABELS[a.category]}</div>
                  <div className="text-[var(--text-tertiary)] text-xs">{CATEGORY_LABELS[a.category]}</div>
                  {a.weightGrams && <div className="text-[var(--text-tertiary)] text-xs">{a.weightGrams}g</div>}
                  <div className="text-[var(--text-tertiary)] text-xs">Added {fmtDate(a.addedAt)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[var(--accent-primary)] font-semibold">{fmtMoney(val, currency)}</div>
                  <div className={cn('text-[10px] font-medium', complete ? 'text-green-400' : 'text-amber-400')}>
                    {complete ? '✓ Hawl done' : `${Math.max(0, HAWL_DAYS - days)}d left`}
                  </div>
                </div>
                <button onClick={() => onDelete(a.id)} className="text-[var(--text-tertiary)] hover:text-rose-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]">
                <span>{days} of {HAWL_DAYS} days held</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full', complete ? 'bg-green-400' : 'bg-[var(--accent-primary)]')} style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
          </div>
        );
      })}
      <button onClick={onAdd} className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl flex items-center justify-center gap-2">
        <Plus size={18} /> Add Asset
      </button>
    </>
  );
}

// ── Liabilities Section ───────────────────────────────────────────────────────

function LiabilitiesSection({ liabilities, currency, onDelete, onAdd }: {
  liabilities: ZakatLiability[]; currency: string; onDelete: (id: string) => void; onAdd: () => void;
}) {
  return (
    <>
      <p className="text-[var(--text-tertiary)] text-xs">Debts are subtracted from zakatable assets per most madhab rulings.</p>
      {liabilities.length === 0 ? (
        <div className="text-center py-10 text-[var(--text-tertiary)]">
          <Scale size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No liabilities added</p>
        </div>
      ) : liabilities.map(l => (
        <div key={l.id} className="bg-[var(--bg-secondary)] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[var(--text-primary)] font-medium text-sm">{l.label || LIABILITY_LABELS[l.category]}</div>
            <div className="text-[var(--text-tertiary)] text-xs">{LIABILITY_LABELS[l.category]}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-rose-400 font-semibold">-{fmtMoney(l.value, currency)}</div>
            <button onClick={() => onDelete(l.id)} className="text-[var(--text-tertiary)] hover:text-rose-400 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      <button onClick={onAdd} className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl flex items-center justify-center gap-2">
        <Plus size={18} /> Add Liability
      </button>
    </>
  );
}

// ── Payments Section ──────────────────────────────────────────────────────────

function PaymentsSection({ payments, currency, onAdd }: { payments: ZakatPayment[]; currency: string; onAdd: () => void }) {
  const total = payments.reduce((s, p) => s + p.amount, 0);
  return (
    <>
      {payments.length > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-3 text-center">
          <div className="text-[var(--accent-primary)] font-semibold text-xl">{fmtMoney(total, currency, 2)}</div>
          <div className="text-[var(--text-tertiary)] text-xs">total zakat paid — may Allah accept 🤍</div>
        </div>
      )}
      {payments.length === 0 ? (
        <div className="text-center py-10 text-[var(--text-tertiary)] text-sm">No payments recorded yet</div>
      ) : payments.map(p => (
        <div key={p.id} className="bg-[var(--bg-secondary)] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="text-[var(--text-primary)] font-medium">{fmtMoney(p.amount, p.currency || currency, 2)}</div>
            <div className="text-[var(--text-tertiary)] text-xs">{p.paidDate}</div>
          </div>
          {p.recipientCategory && <div className="text-[var(--text-tertiary)] text-xs mt-1">{RECIPIENT_LABELS[p.recipientCategory]}</div>}
          {p.recipientNote && <div className="text-[var(--text-secondary)] text-xs mt-1">{p.recipientNote}</div>}
        </div>
      ))}
      <button onClick={onAdd} className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl flex items-center justify-center gap-2">
        <Plus size={18} /> Log Payment
      </button>
    </>
  );
}

// ── Add Asset Form ────────────────────────────────────────────────────────────

function AddAssetForm({ currency, prices, onSave }: {
  currency: string; prices: MetalPrices;
  onSave: (a: Omit<ZakatAsset, 'id' | 'addedAt'>) => Promise<void>;
}) {
  const [category, setCategory] = useState<ZakatAssetCategory>('cash');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [weightGrams, setWeightGrams] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isGoldSilver = category === 'gold' || category === 'silver';
  const pricePerGram = category === 'gold' ? prices.goldPerGram : prices.silverPerGram;
  const approxValue = isGoldSilver ? (parseFloat(weightGrams) || 0) * pricePerGram : 0;

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave({ category, label: label || undefined, value: parseFloat(value), currency, weightGrams: weightGrams ? parseFloat(weightGrams) : undefined });
    } finally { setIsSaving(false); }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[var(--text-secondary)] text-sm mb-2 block">Category</label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(CATEGORY_LABELS) as [ZakatAssetCategory, string][]).map(([id, lbl]) => (
            <button key={id} onClick={() => setCategory(id)}
              className={cn('px-3 py-1.5 rounded-full text-xs transition-all', category === id ? 'bg-[var(--accent-primary)] text-[#0D1421]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]')}>
              {CATEGORY_EMOJI[id]} {lbl}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[var(--text-secondary)] text-sm mb-1 block">Label (optional)</label>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder={CATEGORY_LABELS[category]}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
      </div>
      {isGoldSilver && (
        <div>
          <label className="text-[var(--text-secondary)] text-sm mb-1 block">Weight (grams)</label>
          <input type="text" inputMode="decimal" pattern="[0-9.]*"
            value={weightGrams} onChange={e => setWeightGrams(e.target.value)} placeholder="0"
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
          <div className="flex items-center justify-between mt-1">
            <p className="text-[var(--text-tertiary)] text-xs">
              Approx. {fmtMoney(approxValue, currency, 2)} at {fmtMoney(pricePerGram, currency, 2)}/g
            </p>
            <p className="text-[var(--text-tertiary)] text-xs flex items-center gap-1">
              <span className={cn('w-1.5 h-1.5 rounded-full', prices.live ? 'bg-green-400' : 'bg-amber-400')} />
              {prices.live ? 'live rate' : 'estimated'}
            </p>
          </div>
          {approxValue > 0 && !value && (
            <button onClick={() => setValue(approxValue.toFixed(2))}
              className="mt-2 text-[var(--accent-primary)] text-xs underline">
              Use this value ({fmtMoney(approxValue, currency, 2)})
            </button>
          )}
        </div>
      )}
      <div>
        <label className="text-[var(--text-secondary)] text-sm mb-1 block">Value ({currency})</label>
        <input type="text" inputMode="decimal" pattern="[0-9.]*"
          value={value} onChange={e => setValue(e.target.value)} placeholder="0.00"
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
      </div>
      <button
        disabled={!value || parseFloat(value) <= 0 || isSaving}
        onClick={handleSave}
        className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50 transition-opacity">
        {isSaving ? 'Saving…' : 'Add Asset'}
      </button>
    </div>
  );
}

// ── Add Liability Form ────────────────────────────────────────────────────────

function AddLiabilityForm({ currency, onSave }: { currency: string; onSave: (l: Omit<ZakatLiability, 'id'>) => Promise<void> }) {
  const [category, setCategory] = useState<ZakatLiabilityCategory>('loan');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    try { await onSave({ category, label: label || undefined, value: parseFloat(value), currency }); }
    finally { setIsSaving(false); }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[var(--text-secondary)] text-sm mb-2 block">Category</label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(LIABILITY_LABELS) as [ZakatLiabilityCategory, string][]).map(([id, lbl]) => (
            <button key={id} onClick={() => setCategory(id)}
              className={cn('px-3 py-1.5 rounded-full text-xs transition-all', category === id ? 'bg-[var(--accent-primary)] text-[#0D1421]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]')}>
              {lbl}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[var(--text-secondary)] text-sm mb-1 block">Label (optional)</label>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder={LIABILITY_LABELS[category]}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
      </div>
      <div>
        <label className="text-[var(--text-secondary)] text-sm mb-1 block">Amount ({currency})</label>
        <input type="text" inputMode="decimal" pattern="[0-9.]*"
          value={value} onChange={e => setValue(e.target.value)} placeholder="0.00"
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
      </div>
      <button
        disabled={!value || parseFloat(value) <= 0 || isSaving}
        onClick={handleSave}
        className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50 transition-opacity">
        {isSaving ? 'Saving…' : 'Add Liability'}
      </button>
    </div>
  );
}

// ── Add Payment Form ──────────────────────────────────────────────────────────

function AddPaymentForm({ onSave, zakatAmount, currency }: {
  onSave: (p: Omit<ZakatPayment, 'id' | 'loggedAt'>) => Promise<void>; zakatAmount: number; currency: string;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [paidDate, setPaidDate] = useState(today);
  const [amount, setAmount] = useState(zakatAmount > 0 ? zakatAmount.toFixed(2) : '');
  const [recipient, setRecipient] = useState<ZakatRecipientCategory>('poor');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    try { await onSave({ paidDate, amount: parseFloat(amount), currency, recipientCategory: recipient, recipientNote: note || undefined }); }
    finally { setIsSaving(false); }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[var(--text-secondary)] text-sm mb-1 block">Date Paid</label>
        <input type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
      </div>
      <div>
        <label className="text-[var(--text-secondary)] text-sm mb-1 block">Amount ({currency})</label>
        <input type="text" inputMode="decimal" pattern="[0-9.]*"
          value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
      </div>
      <div>
        <label className="text-[var(--text-secondary)] text-sm mb-2 block">Recipient (Quran 9:60)</label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(RECIPIENT_LABELS) as [ZakatRecipientCategory, string][]).map(([id, lbl]) => (
            <button key={id} onClick={() => setRecipient(id)}
              className={cn('px-3 py-1.5 rounded-full text-xs transition-all', recipient === id ? 'bg-[var(--accent-primary)] text-[#0D1421]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]')}>
              {lbl}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[var(--text-secondary)] text-sm mb-1 block">Note (optional)</label>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Charity name, individual, etc."
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
      </div>
      <button
        disabled={!amount || parseFloat(amount) <= 0 || isSaving}
        onClick={handleSave}
        className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50 transition-opacity">
        {isSaving ? 'Saving…' : 'Record Payment'}
      </button>
    </div>
  );
}

// ── Add Sadaqa Form ───────────────────────────────────────────────────────────

function AddSadaqaForm({ currency, onSave }: {
  currency: string; onSave: (s: Omit<SadaqaLog, 'id' | 'loggedAt'>) => Promise<void>;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState<SadaqaType>('sadaqa');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (isSaving || !amount || parseFloat(amount) <= 0) return;
    setIsSaving(true);
    try {
      await onSave({ type, amount: parseFloat(amount), currency, date, recipient: recipient || undefined, note: note || undefined });
      setSaved(true); // navigation happens inside onSave; this is just a safety flag
    } finally { setIsSaving(false); }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[var(--text-secondary)] text-sm mb-2 block">Type</label>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(SADAQA_TYPE_LABELS) as [SadaqaType, string][]).map(([id, lbl]) => (
            <button key={id} onClick={() => setType(id)}
              className={cn('px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5', type === id ? 'bg-[var(--accent-primary)] text-[#0D1421]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]')}>
              {SADAQA_TYPE_EMOJI[id]} {lbl}
            </button>
          ))}
        </div>
        <p className="text-[var(--text-tertiary)] text-xs mt-2">{SADAQA_TYPE_DESC[type]}</p>
      </div>
      <div>
        <label className="text-[var(--text-secondary)] text-sm mb-1 block">Amount ({currency})</label>
        <input
          type="text" inputMode="decimal" pattern="[0-9.]*"
          value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
          autoFocus
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40" />
      </div>
      <div>
        <label className="text-[var(--text-secondary)] text-sm mb-1 block">Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today}
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
      </div>
      <div>
        <label className="text-[var(--text-secondary)] text-sm mb-1 block">Recipient / Organisation (optional)</label>
        <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="e.g. Local masjid, UNHCR, individual"
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
      </div>
      <div>
        <label className="text-[var(--text-secondary)] text-sm mb-1 block">Note (optional)</label>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="Intention, purpose, or reminder"
          className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none" />
      </div>
      <button
        disabled={!amount || parseFloat(amount) <= 0 || isSaving || saved}
        onClick={handleSave}
        className="w-full py-3.5 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50 transition-all active:scale-[0.98]">
        {isSaving ? 'Saving…' : saved ? '✓ Saved' : `Log Sadaqa · ${amount ? fmtMoney(parseFloat(amount) || 0, currency, 2) : currency}`}
      </button>
    </div>
  );
}
