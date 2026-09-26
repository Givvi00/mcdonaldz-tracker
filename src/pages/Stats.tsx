import { useEffect, useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { getAchievements } from '@/services/db';
import { getAchievementProgress } from '@/services/achievements';
import { regionRecordType, regionSummaries, regionTier, type RegionTier } from '@/services/regions';
import { ItalyMap } from '@/components/ItalyMap';
import { Passport } from '@/components/Passport';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { RegionAlbum } from '@/components/RegionAlbum';
import type { FoodIconName } from '@/utils/foodTheme';
import { FoodPattern } from '@/components/FoodPattern';
import { FoodProgressBar } from '@/components/FoodProgressBar';
import { Receipt } from '@/components/Receipt';
import { SectionTitle } from '@/components/SectionTitle';
import type { Achievement } from '@shared/types';
import { levelInfo } from '@/utils/foodTheme';
import { shareCard } from '@/services/shareCard';

export function Stats() {
  const { user, visits, getVisitedCount, getCountedTotal, getRegionStats, mcdonalds, focusedAchievements, clearFocusedAchievement } =
    useMcdonaldStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (user) {
      getAchievements(user.id).then(setAchievements);
    }
  }, [user, visits]);

  // Arrived from an achievement toast: scroll to that achievement and highlight it for a few seconds
  useEffect(() => {
    if (focusedAchievements.length === 0) return;
    const scroll = setTimeout(() => {
      document.getElementById(`ach-${focusedAchievements[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
    const clear = setTimeout(clearFocusedAchievement, 5000);
    return () => {
      clearTimeout(scroll);
      clearTimeout(clear);
    };
  }, [focusedAchievements, clearFocusedAchievement]);

  const visitedCount = getVisitedCount();
  const regionStats = getRegionStats();
  const totalMcdonalds = getCountedTotal();
  const latest = visits.reduce<(typeof visits)[number] | null>((best, v) => (!best || v.visitedAt > best.visitedAt ? v : best), null);
  const lastMc = latest ? mcdonalds.find(m => m.id === latest.mcdonaldId) : undefined;
  const lastVisit = latest && lastMc ? { city: lastMc.city, visitedAt: latest.visitedAt } : null;
  const percentage = totalMcdonalds > 0 ? Math.round((visitedCount / totalMcdonalds) * 100) : 0;
  const verifiedCount = visits.filter(v => v.verified).length;
  const verifiedShare = visitedCount > 0 ? Math.round((verifiedCount / visitedCount) * 100) : 0;
  // Verified visits per region, for the receipt
  const regionOf = new Map(mcdonalds.map(m => [m.id, m.region]));
  const verifiedByRegion = new Map<string, number>();
  for (const v of visits) {
    const region = v.verified ? regionOf.get(v.mcdonaldId) : undefined;
    if (region) verifiedByRegion.set(region, (verifiedByRegion.get(region) ?? 0) + 1);
  }
  const receiptRows = regionStats.map(r => ({ ...r, verified: verifiedByRegion.get(r.region) ?? 0 }));
  const progress = getAchievementProgress(mcdonalds, visits);
  const summaries = regionSummaries(mcdonalds, visits);
  const unlockedIds = new Set(achievements.map(a => a.type));
  const completedAt = Object.fromEntries(
    achievements.filter(a => a.type.startsWith('REGION:')).map(a => [a.type.slice('REGION:'.length), a.unlockedAt]),
  );
  const diamondAt = Object.fromEntries(
    achievements.filter(a => a.type.startsWith('DIAMOND:')).map(a => [a.type.slice('DIAMOND:'.length), a.unlockedAt]),
  );
  const unlockedAt = Object.fromEntries(achievements.map(a => [a.type, a.unlockedAt]));
  const wasComplete = new Set(summaries.map(r => r.region).filter(r => unlockedIds.has(regionRecordType(r))));

  const tiers: Record<string, RegionTier> = {};
  for (const r of summaries) tiers[r.region] = regionTier(r, wasComplete.has(r.region));

  const share = async () => {
    const level = levelInfo(visitedCount);
    setSharing(true);
    try {
      await shareCard({
        username: user?.name,
        visited: visitedCount,
        total: totalMcdonalds,
        verified: verifiedCount,
        level: level.number,
        levelName: level.level.name,
        stamps: achievements.filter(a => !a.type.startsWith('REGION:') && !a.type.startsWith('DIAMOND:')).length,
        regions: receiptRows.map(r => ({ region: r.region, visited: r.visited, verified: r.verified, total: r.total, tier: tiers[r.region] ?? 'empty' })),
      });
    } catch {
      // nothing to tell: the share sheet could not open, the button can be tapped again
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-8">
      {/* Big Counter */}
      <div className="relative bg-gradient-to-br from-mc-red to-red-700 text-white rounded-3xl p-6 text-center shadow-lg shadow-red-900/20 overflow-hidden">
        <FoodPattern />
        <button
          onClick={() => void share()}
          disabled={sharing}
          aria-label="Condividi i tuoi numeri"
          className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur-sm transition-transform active:scale-95 disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
          </svg>
          {sharing ? '…' : 'Condividi'}
        </button>
        <div className="relative">
          <p className="text-sm opacity-90 font-display font-semibold">Totale McDonald's Visitati</p>
          <p className="text-6xl font-display font-bold mt-2">{visitedCount}</p>
          <p className="text-sm opacity-90 mt-1">di {totalMcdonalds} in Italia</p>
          {lastVisit && (
            <p className="mt-1 text-xs opacity-80">
              Ultimo Mc: {lastVisit.city} · {new Date(lastVisit.visitedAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
            </p>
          )}
          {verifiedCount > 0 && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-white/15 py-0.5 pl-0.5 pr-2.5 text-xs font-semibold">
              <VerifiedBadge size={20} /> {verifiedCount} {verifiedCount === 1 ? 'verificata' : 'verificate'} · {verifiedShare}% delle visite
            </p>
          )}
          <p className="text-2xl font-display font-bold mt-3">{percentage}%</p>
          <FoodProgressBar percentage={percentage} />
        </div>
      </div>

      <Passport unlocked={unlockedIds} unlockedAt={unlockedAt} progress={progress} focused={focusedAchievements} />

      <Section icon="mcflurry" title="Regioni">
        <ItalyMap tiers={tiers} className="mx-auto mb-5 w-full max-w-[15rem]" />
        <RegionAlbum summaries={summaries} wasComplete={wasComplete} completedAt={completedAt} diamondAt={diamondAt} />
        <div className="mt-5">
          <Receipt name={user?.name} rows={receiptRows} visited={visitedCount} total={totalMcdonalds} verified={verifiedCount} />
        </div>
      </Section>
    </div>
  );
}

function Section({ icon, title, children }: { icon: FoodIconName; title: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionTitle icon={icon}>{title}</SectionTitle>
      {children}
    </div>
  );
}
