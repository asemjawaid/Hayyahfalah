'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { db, type PrayerName } from '@/lib/db';
import { cn } from '@/lib/utils';

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
}

function estimateQaza(pubertyDate: string, prayerStartDate: string, avgCycleDaysPerMonth: number, gender: string): number {
  if (!pubertyDate || !prayerStartDate) return 0;
  const puberty = new Date(pubertyDate);
  const start = new Date(prayerStartDate);
  if (start <= puberty) return 0;
  const totalDays = daysBetween(puberty, start);
  let excusedDays = 0;
  if (gender === 'female' && avgCycleDaysPerMonth > 0) {
    excusedDays = Math.round(totalDays * (avgCycleDaysPerMonth / 30));
  }
  return Math.max(0, totalDays - excusedDays) * 5; // 5 prayers per day
}

export function QazaEstimationModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [pubertyDate, setPubertyDate] = useState('');
  const [prayerStartDate, setPrayerStartDate] = useState('');
  const [cycleDays, setCycleDays] = useState('6');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [manualAdjust, setManualAdjust] = useState<number | null>(null);
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [saving, setSaving] = useState(false);

  const estimated = estimateQaza(pubertyDate, prayerStartDate, gender === 'female' ? parseFloat(cycleDays) : 0, gender);
  const perPrayer = Math.round((manualAdjust ?? estimated) / 5);
  const finalTotal = manualAdjust ?? estimated;

  async function save() {
    setSaving(true);
    const now = new Date().toISOString();
    for (const prayer of PRAYERS) {
      const existing = await db.qazaLedger.get(prayer);
      await db.qazaLedger.put({
        prayer,
        count: perPrayer + (existing?.count ?? 0),
        totalMadeUp: existing?.totalMadeUp ?? 0,
        lastUpdated: now,
      });
    }
    setSaving(false);
    onDone();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full bg-[var(--bg-secondary)] rounded-t-3xl p-6 space-y-5 max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-[var(--text-primary)]">Estimate Qaza Balance</h3>
          <button onClick={onClose} className="text-[var(--text-tertiary)] text-xl">✕</button>
        </div>

        <p className="text-[var(--text-tertiary)] text-sm">
          For those returning to regular prayer with years of missed prayers — enter approximate dates to calculate your starting balance.
        </p>

        {step === 'input' ? (
          <div className="space-y-5">
            <div>
              <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-2 block">I am</label>
              <div className="flex gap-2">
                {(['male', 'female'] as const).map(g => (
                  <button key={g} onClick={() => setGender(g)} className={cn('flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all', gender === g ? 'bg-[var(--accent-primary)] text-[#0D1421]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]')}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1 block">
                Approximate date I reached puberty (baligh)
              </label>
              <input
                type="date"
                value={pubertyDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setPubertyDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] focus:outline-none"
              />
              <p className="text-[var(--text-tertiary)] text-xs mt-1">Prayer becomes obligatory from this date</p>
            </div>

            <div>
              <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1 block">
                When I started praying consistently
              </label>
              <input
                type="date"
                value={prayerStartDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setPrayerStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] focus:outline-none"
              />
              <p className="text-[var(--text-tertiary)] text-xs mt-1">The gap between these dates is the missed period</p>
            </div>

            {gender === 'female' && (
              <div>
                <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1 block">
                  Average cycle length (days/month)
                </label>
                <input
                  type="number"
                  value={cycleDays}
                  min="0"
                  max="15"
                  onChange={e => setCycleDays(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] focus:outline-none"
                />
                <p className="text-[var(--text-tertiary)] text-xs mt-1">These days are excused — excluded from Qaza count</p>
              </div>
            )}

            {pubertyDate && prayerStartDate && estimated > 0 && (
              <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 space-y-2">
                <div className="text-[var(--text-secondary)] text-sm">Estimated total prayers: <strong className="text-[var(--text-primary)]">{estimated.toLocaleString()}</strong></div>
                <div className="text-[var(--text-tertiary)] text-xs">≈ {perPrayer.toLocaleString()} per prayer type</div>
                <div>
                  <label className="text-[var(--text-tertiary)] text-xs block mb-1">Adjust total (if your estimate differs)</label>
                  <input
                    type="number"
                    placeholder={String(estimated)}
                    onChange={e => setManualAdjust(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm focus:outline-none"
                  />
                </div>
              </div>
            )}

            <button
              disabled={!pubertyDate || !prayerStartDate || estimated === 0}
              onClick={() => setStep('confirm')}
              className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50"
            >
              Review Estimate
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 space-y-3">
              <div className="text-center">
                <div className="text-[var(--accent-primary)] font-display text-3xl font-semibold">{finalTotal.toLocaleString()}</div>
                <div className="text-[var(--text-tertiary)] text-sm">total prayers to make up</div>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center">
                {PRAYERS.map(p => (
                  <div key={p}>
                    <div className="text-[var(--text-primary)] font-semibold text-sm">{perPrayer.toLocaleString()}</div>
                    <div className="text-[var(--text-tertiary)] text-[10px] capitalize">{p}</div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[var(--text-tertiary)] text-sm">
              This will be added to your Qaza ledger. You can make them up gradually — even one per prayer per day is a start. May Allah accept every prayer.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setStep('input')} className="flex-1 py-3 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-medium rounded-xl">
                Back
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Set Balance'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
