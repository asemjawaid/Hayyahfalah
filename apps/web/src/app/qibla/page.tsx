'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, MapPin } from 'lucide-react';
import { BottomNav } from '@/components/ui/nav';
import { usePrayerTimesStore } from '@/store/prayer-times-store';
import { getQiblaDirection } from '@/lib/prayer-engine';
import { cn } from '@/lib/utils';

const MAKKAH_LAT = 21.3891;
const MAKKAH_LNG = 39.8579;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function QiblaPage() {
  const { lat, lng, locate } = usePrayerTimesStore();
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [qiblaDir, setQiblaDir] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lat === null) locate();
  }, []);

  useEffect(() => {
    if (lat !== null && lng !== null) {
      const dir = getQiblaDirection(lat, lng);
      setQiblaDir(dir);
      const dist = haversineDistance(lat, lng, MAKKAH_LAT, MAKKAH_LNG);
      setDistance(Math.round(dist));
    }
  }, [lat, lng]);

  useEffect(() => {
    const win = window as any;
    if (win.DeviceOrientationEvent) {
      const handleOrientation = (e: DeviceOrientationEvent) => {
        const alpha = (e as any).webkitCompassHeading ?? e.alpha;
        if (alpha !== null) setCompassHeading(alpha);
      };
      if (typeof (win.DeviceOrientationEvent as any).requestPermission === 'function') {
        (win.DeviceOrientationEvent as any).requestPermission()
          .then((perm: string) => {
            if (perm === 'granted') {
              window.addEventListener('deviceorientationabsolute', handleOrientation as any, true);
              window.addEventListener('deviceorientation', handleOrientation as any, true);
            }
          })
          .catch(() => setError('Compass permission denied'));
      } else {
        window.addEventListener('deviceorientationabsolute', handleOrientation as any, true);
        window.addEventListener('deviceorientation', handleOrientation as any, true);
      }
      return () => {
        window.removeEventListener('deviceorientationabsolute', handleOrientation as any, true);
        window.removeEventListener('deviceorientation', handleOrientation as any, true);
      };
    }
  }, []);

  const needleRotation = qiblaDir !== null
    ? compassHeading !== null
      ? qiblaDir - compassHeading
      : qiblaDir
    : 0;

  const isAligned = compassHeading !== null && qiblaDir !== null &&
    Math.abs(((qiblaDir - compassHeading + 540) % 360) - 180) < 2;

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Qibla Direction</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Direction of the Kaaba in Makkah</p>
        </div>

        {/* Compass */}
        <div className="flex flex-col items-center space-y-6">
          <div className="relative w-64 h-64">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-[var(--bg-tertiary)] flex items-center justify-center">
              {/* Cardinal directions */}
              {[{ dir: 'N', rot: 0 }, { dir: 'E', rot: 90 }, { dir: 'S', rot: 180 }, { dir: 'W', rot: 270 }].map(({ dir, rot }) => (
                <div
                  key={dir}
                  className="absolute text-xs text-[var(--text-tertiary)] font-mono"
                  style={{
                    transform: `rotate(${rot}deg) translateY(-118px) rotate(-${rot}deg)`,
                  }}
                >
                  {dir}
                </div>
              ))}

              {/* Kaaba needle */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: needleRotation }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              >
                <div className={cn(
                  'w-1 rounded-full transition-colors',
                  isAligned ? 'bg-green-400' : 'bg-[var(--accent-primary)]'
                )} style={{ height: '90px', transformOrigin: 'bottom center', marginBottom: '10px' }}>
                  {/* Kaaba icon at tip */}
                  <div className="w-5 h-5 rounded bg-[var(--accent-primary)] -ml-2 -mt-5 flex items-center justify-center">
                    <span className="text-[8px]">🕋</span>
                  </div>
                </div>
              </motion.div>

              {/* Center dot */}
              <div className="w-3 h-3 rounded-full bg-[var(--accent-primary)] z-10" />
            </div>
          </div>

          {/* Info */}
          {qiblaDir !== null ? (
            <div className="text-center space-y-2">
              <div className={cn(
                'text-2xl font-semibold transition-colors',
                isAligned ? 'text-green-400' : 'text-[var(--text-primary)]'
              )}>
                {isAligned ? '🕋 Facing the Qibla' : `${Math.round(qiblaDir)}° from North`}
              </div>
              {distance !== null && (
                <div className="text-[var(--text-secondary)] text-sm">
                  {distance.toLocaleString()} km to Makkah
                </div>
              )}
              {compassHeading === null && (
                <div className="text-[var(--text-tertiary)] text-xs">
                  No compass detected — showing map-based direction
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-3">
              <Compass size={32} className="mx-auto text-[var(--text-tertiary)]" />
              <p className="text-[var(--text-secondary)] text-sm">
                {lat === null ? 'Location needed for Qibla direction' : 'Calculating…'}
              </p>
              {lat === null && (
                <button onClick={locate} className="text-[var(--accent-primary)] text-sm underline">
                  Allow location
                </button>
              )}
            </div>
          )}

          {error && (
            <p className="text-[var(--text-tertiary)] text-xs text-center">{error}</p>
          )}
        </div>

        {/* Note */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-[var(--text-tertiary)] text-xs leading-relaxed">
          <strong className="text-[var(--text-secondary)]">Note:</strong> Qibla direction is calculated mathematically. Please verify visually when possible. May Allah accept your prayers. 🤲
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
