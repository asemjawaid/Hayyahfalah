'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Search, ExternalLink, Clock, Users, ParkingSquare, Accessibility } from 'lucide-react';
import { BottomNav } from '@/components/ui/nav';
import { usePrayerTimesStore } from '@/store/prayer-times-store';
import { cn } from '@/lib/utils';

interface Mosque {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  tags: Record<string, string>;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchNearbyMosques(lat: number, lng: number, radiusM = 5000): Promise<Mosque[]> {
  const query = `
    [out:json][timeout:15];
    node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lng});
    way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lng});
    out center tags 30;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error('Overpass API error');
  const data = await res.json();

  return (data.elements as any[])
    .filter(el => el.type === 'node' || (el.type === 'way' && el.center))
    .map(el => {
      const elLat = el.type === 'node' ? el.lat : el.center.lat;
      const elLng = el.type === 'node' ? el.lon : el.center.lon;
      const name = el.tags?.name || el.tags?.['name:en'] || 'Unnamed Mosque';
      const address = [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', ') || '';
      return {
        id: String(el.id),
        name,
        address,
        lat: elLat,
        lng: elLng,
        distanceKm: haversineKm(lat, lng, elLat, elLng),
        tags: el.tags ?? {},
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export default function MosquesPage() {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Mosque | null>(null);
  const [search, setSearch] = useState('');
  const { lat, lng, locate } = usePrayerTimesStore();

  const load = useCallback(async (userLat: number, userLng: number) => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchNearbyMosques(userLat, userLng);
      setMosques(results);
    } catch (e) {
      setError('Could not load mosques. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (lat !== null && lng !== null) {
      load(lat, lng);
    }
  }, [lat, lng, load]);

  const filtered = mosques.filter(m =>
    search === '' || m.name.toLowerCase().includes(search.toLowerCase()) || m.address.toLowerCase().includes(search.toLowerCase())
  );

  if (selected) {
    return <MosqueDetail mosque={selected} userLat={lat} userLng={lng} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--bg-secondary)]">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Mosque Finder</h1>
          <p className="text-[var(--text-tertiary)] text-xs">Nearby mosques via OpenStreetMap</p>
        </div>
        {mosques.length > 0 && (
          <div className="max-w-lg mx-auto px-4 pb-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search mosques…"
                className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-secondary)] rounded-xl text-[var(--text-primary)] text-sm focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        {lat === null ? (
          <div className="text-center py-16 space-y-4">
            <MapPin size={40} className="mx-auto text-[var(--accent-primary)] opacity-60" />
            <div>
              <p className="text-[var(--text-secondary)] font-medium">Location needed</p>
              <p className="text-[var(--text-tertiary)] text-sm mt-1">Allow location to find nearby mosques</p>
            </div>
            <button
              onClick={locate}
              className="px-6 py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl"
            >
              Allow location
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full mx-auto"
            />
            <p className="text-[var(--text-tertiary)] text-sm mt-4">Finding nearby mosques…</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-[var(--text-secondary)] text-sm">{error}</p>
            <button onClick={() => load(lat!, lng!)} className="text-[var(--accent-primary)] text-sm">Try again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-tertiary)] text-sm">
            {search ? 'No mosques match your search' : 'No mosques found within 5km'}
          </div>
        ) : (
          <>
            <p className="text-[var(--text-tertiary)] text-xs">{filtered.length} mosque{filtered.length !== 1 ? 's' : ''} found</p>
            {filtered.map((mosque, i) => (
              <motion.button
                key={mosque.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelected(mosque)}
                className="w-full bg-[var(--bg-secondary)] rounded-2xl p-4 text-left hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[var(--text-primary)] font-medium truncate">{mosque.name}</div>
                    {mosque.address && (
                      <div className="text-[var(--text-tertiary)] text-xs mt-0.5 truncate">{mosque.address}</div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-[var(--accent-primary)] text-xs font-medium">
                        <Navigation size={12} />
                        {mosque.distanceKm < 1
                          ? `${Math.round(mosque.distanceKm * 1000)}m`
                          : `${mosque.distanceKm.toFixed(1)}km`}
                      </div>
                      {mosque.tags['wheelchair'] === 'yes' && (
                        <Accessibility size={12} className="text-[var(--text-tertiary)]" />
                      )}
                      {mosque.tags['parking'] && (
                        <ParkingSquare size={12} className="text-[var(--text-tertiary)]" />
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
            <p className="text-[var(--text-tertiary)] text-xs text-center pb-2">
              Data from OpenStreetMap contributors. Verify times with your local masjid.
            </p>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function MosqueDetail({ mosque, userLat, userLng, onBack }: { mosque: Mosque; userLat: number | null; userLng: number | null; onBack: () => void }) {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mosque.lat},${mosque.lng}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${mosque.lat}&mlon=${mosque.lng}#map=17/${mosque.lat}/${mosque.lng}`;

  const facilities = [
    mosque.tags['prayer_hall:female'] === 'yes' || mosque.tags['female'] === 'yes' ? "Women's section" : null,
    mosque.tags['wheelchair'] === 'yes' ? 'Wheelchair accessible' : null,
    mosque.tags['parking'] ? 'Parking' : null,
    mosque.tags['toilets:wudu'] === 'yes' || mosque.tags['wudu'] === 'yes' ? 'Wudu facilities' : null,
  ].filter(Boolean);

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--bg-secondary)]">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="text-[var(--accent-primary)]">← Back</button>
          <h2 className="font-display text-xl text-[var(--text-primary)] truncate">{mosque.name}</h2>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
            <div>
              {mosque.address && <div className="text-[var(--text-secondary)] text-sm">{mosque.address}</div>}
              <div className="text-[var(--text-tertiary)] text-xs mt-0.5">
                {mosque.distanceKm < 1
                  ? `${Math.round(mosque.distanceKm * 1000)}m away`
                  : `${mosque.distanceKm.toFixed(1)}km away`}
              </div>
            </div>
          </div>

          {mosque.tags['phone'] && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span>📞</span> {mosque.tags['phone']}
            </div>
          )}

          {mosque.tags['website'] && (
            <a href={mosque.tags['website']} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[var(--accent-primary)]">
              <ExternalLink size={14} /> {mosque.tags['website']}
            </a>
          )}

          {facilities.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {facilities.map(f => (
                <span key={f} className="text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-1 rounded-full">{f}</span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl text-center text-sm"
          >
            Get Directions
          </a>
          <a
            href={osmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium rounded-xl text-center text-sm"
          >
            View on Map
          </a>
        </div>

        <p className="text-[var(--text-tertiary)] text-xs text-center">
          Data from OpenStreetMap. Prayer times shown are calculated — verify iqamah with the masjid directly.
        </p>
      </div>
    </div>
  );
}
