import type { McDonald, Visit } from '@shared/types';
import { getAchievements, addAchievement } from './db';
import { countedMcdonalds, visitedIdSet } from '@/utils/catalog';
import { restaurantKind } from '@/utils/foodTheme';
import { completedRegions } from './regions';

// The achievements are the stamps of the passport. Each one belongs to a family (colour and page in the passport)
// and has a shape and a symbol (see components/stampArt.ts). Secret ones show only "???" until you get them.

export type StampFamily = 'regioni' | 'geo' | 'tipi' | 'rari' | 'segreti';
export type StampShape = 'circle' | 'rect' | 'shield' | 'hex';

export interface AchievementProgress {
  current: number;
  target: number;
  label?: string;
}

export interface AchievementDef {
  id: string;
  family: StampFamily;
  shape: StampShape;
  symbol: string;
  name: string;
  description: string;
  secret?: boolean;
}

export const FAMILIES: ReadonlyArray<{ id: StampFamily; title: string; blurb: string }> = [
  { id: 'regioni', title: 'Regioni', blurb: "Il tuo giro d'Italia, un timbro alla volta." },
  { id: 'geo', title: 'Geografia', blurb: 'Dove sei arrivato.' },
  { id: 'tipi', title: 'Tipi di locale', blurb: 'Aeroporti, stazioni, drive: ogni locale ha il suo timbro.' },
  { id: 'rari', title: 'Rarità', blurb: 'Quelli che non capitano a tutti.' },
  { id: 'segreti', title: 'Pagina segreta', blurb: 'Alcuni timbri non dicono come si ottengono: li scopri per caso.' },
];

const def = (
  id: string,
  family: StampFamily,
  shape: StampShape,
  symbol: string,
  name: string,
  description: string,
  secret = false,
): AchievementDef => ({ id, family, shape, symbol, name, description, secret });

// The first three ids and REGIONAL_MASTER are older ids kept as they were, so what you already unlocked stays unlocked.
export const ACHIEVEMENT_LIST: readonly AchievementDef[] = [
  def('FIRST_STAMP', 'regioni', 'circle', 'pin', 'Primo timbro', "Segna il tuo primo McDonald's"),
  def('EXPLORER', 'regioni', 'circle', 'compass', 'Esploratore', "Visita McDonald's in 5 regioni"),
  def('HALF_ITALY', 'regioni', 'circle', 'map', 'Mezza Italia', "Visita McDonald's in 10 regioni"),
  def('NATION_CONQUEROR', 'regioni', 'circle', 'flag', "Giro d'Italia a morsi", "Visita almeno un McDonald's in ogni regione"),
  def('LOCAL_HERO', 'regioni', 'circle', 'pincheck', 'Eroe del quartiere', "Visita 5 McDonald's nella stessa regione"),
  def('REGIONAL_MASTER', 'regioni', 'circle', 'crown', 'Regione spolpata', "Completa tutti i McDonald's di una regione"),
  def('HALF_ALBUM', 'regioni', 'circle', 'star', 'Album a metà', 'Completa 10 regioni'),
  def('NORTH_SOUTH', 'geo', 'hex', 'ns', 'Da Nord a Sud', "Visita il McDonald's più a nord e quello più a sud"),
  def('ISLANDER', 'geo', 'hex', 'island', 'Isolano', "Un McDonald's in Sicilia e uno in Sardegna"),
  def('METROPOLITAN', 'geo', 'hex', 'skyline', 'Metropolitano', 'Roma, Milano, Napoli e Torino'),
  def('PROVINCES_30', 'geo', 'hex', 'mapdots', 'Una per provincia', "Visita McDonald's in 30 province diverse"),
  def('AIRPORT', 'tipi', 'rect', 'plane', 'Check-in gate', "Un McDonald's in aeroporto"),
  def('STATION', 'tipi', 'rect', 'train', 'Sul binario 1', "Un McDonald's in stazione"),
  def('DRIVE', 'tipi', 'rect', 'car', 'Dal finestrino', "Un McDonald's con il Drive"),
  def('MALL', 'tipi', 'rect', 'bag', 'Shopping e panini', "Un McDonald's in un centro commerciale"),
  def('HIGHWAY', 'tipi', 'rect', 'road', 'Pausa in autostrada', "Un McDonald's in area di servizio"),
  def('ALL_KINDS', 'tipi', 'rect', 'star', 'Collezione completa', 'Un McDonald\'s per ogni tipo di locale'),
  def('BEFORE_CLOSING', 'rari', 'shield', 'hourglass', 'Ci sono stato prima che chiudesse', "Hai visitato un McDonald's che poi ha chiuso"),
  def('PIONEER', 'rari', 'shield', 'rocket', 'Pioniere', "Visita un McDonald's appena aperto"),
  def('CRITIC', 'rari', 'shield', 'star', 'Critico gastronomico', "Vota almeno 10 McDonald's che hai visitato"),
  def('GPS_VERIFIED', 'rari', 'shield', 'pincheck', 'Sul posto', "Segna 25 visite col GPS attivo, mentre sei davvero lì"),
  def('NIGHT_OWL', 'segreti', 'circle', 'moon', 'Nottambulo', 'Segna una visita tra mezzanotte e le cinque', true),
  def('FERRAGOSTO', 'segreti', 'circle', 'sun', 'Ferragosto a tavola', "Un McDonald's il 15 agosto", true),
  def('DOUBLE', 'segreti', 'circle', 'two', 'Doppietta', "Due McDonald's nello stesso giorno", true),
  def('LUCKY_77', 'segreti', 'circle', 'seven', 'Fortunello', "Il tuo 77° McDonald's", true),
];

export const ACHIEVEMENTS: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENT_LIST.map(a => [a.id, a]));

const ALL_KINDS = ['Aeroporto', 'Stazione', 'Area di servizio', 'Drive', 'Centro commerciale'];
const METROPOLIS = ['Roma', 'Milano', 'Napoli', 'Torino'];
const NEW_FOR_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

const yes = (done: boolean): AchievementProgress => ({ current: done ? 1 : 0, target: 1 });
const count = (current: number, target: number, label?: string): AchievementProgress => ({
  current: Math.min(current, target),
  target,
  label,
});

export function getAchievementProgress(mcdonalds: McDonald[], visits: Visit[]): Record<string, AchievementProgress> {
  const visitedIds = visitedIdSet(visits);
  const byId = new Map(mcdonalds.map(mc => [mc.id, mc]));
  const visitedMcs = [...visitedIds].map(id => byId.get(id)).filter((mc): mc is McDonald => !!mc);
  const counted = countedMcdonalds(mcdonalds, visits);

  // Per region: open restaurants plus closed ones you visited; a closure never undoes a regional completion
  const totalByRegion: Record<string, number> = {};
  const visitedByRegion: Record<string, number> = {};
  for (const mc of counted) {
    totalByRegion[mc.region] = (totalByRegion[mc.region] || 0) + 1;
    if (visitedIds.has(mc.id)) visitedByRegion[mc.region] = (visitedByRegion[mc.region] || 0) + 1;
  }
  let topRegion = { region: '', count: 0 };
  let bestPartial = { region: '', current: 0, target: 1 };
  let anyRegionComplete = false;
  for (const [region, n] of Object.entries(visitedByRegion)) {
    const total = totalByRegion[region];
    if (n > topRegion.count) topRegion = { region, count: n };
    if (n === total) anyRegionComplete = true;
    if (n / total > bestPartial.current / bestPartial.target) bestPartial = { region, current: n, target: total };
  }
  const regionsVisited = Object.keys(visitedByRegion).length;
  const totalRegions = new Set(counted.map(m => m.region)).size;

  const provinces = new Set(visitedMcs.map(mc => mc.city));
  const kinds = new Set(visitedMcs.map(mc => restaurantKind(mc)?.label).filter((k): k is string => !!k));

  // Northernmost and southernmost restaurant of the whole list
  const located = mcdonalds;
  const north = located.reduce<McDonald | null>((best, mc) => (!best || mc.lat > best.lat ? mc : best), null);
  const south = located.reduce<McDonald | null>((best, mc) => (!best || mc.lat < best.lat ? mc : best), null);
  const northSouth = (north && visitedIds.has(north.id) ? 1 : 0) + (south && visitedIds.has(south.id) ? 1 : 0);

  const visitedRegions = new Set(visitedMcs.map(mc => mc.region));
  const islands = (visitedRegions.has('Sicilia') ? 1 : 0) + (visitedRegions.has('Sardegna') ? 1 : 0);

  // Stamps that depend on exactly when you were there only count visits the GPS itself confirmed, not ones you just
  // said happened (whatever the time on them says, it could be edited or simply typed in later from the couch)
  const live = visits.filter(v => v.verified);
  const pioneer = live.some(v => {
    const mc = byId.get(v.mcdonaldId);
    const added = mc?.addedAt ? Date.parse(mc.addedAt) : NaN;
    return Number.isFinite(added) && v.visitedAt - added >= 0 && v.visitedAt - added < NEW_FOR_DAYS * DAY;
  });
  const beforeClosing = visitedMcs.some(mc => !mc.opened);

  const nightOwl = live.some(v => new Date(v.visitedAt).getHours() < 5);
  const ferragosto = live.some(v => {
    const d = new Date(v.visitedAt);
    return d.getMonth() === 7 && d.getDate() === 15;
  });
  const perDay = new Map<string, number>();
  for (const v of live) {
    const key = new Date(v.visitedAt).toDateString();
    perDay.set(key, (perDay.get(key) || 0) + 1);
  }
  const doubleDay = [...perDay.values()].some(n => n >= 2);

  const kind = (label: string) => yes(kinds.has(label));

  return {
    FIRST_STAMP: yes(visitedIds.size >= 1),
    EXPLORER: count(regionsVisited, 5),
    HALF_ITALY: count(regionsVisited, 10),
    NATION_CONQUEROR: { current: regionsVisited, target: totalRegions },
    LOCAL_HERO: { current: Math.min(topRegion.count, 5), target: 5, label: topRegion.region || undefined },
    REGIONAL_MASTER: anyRegionComplete
      ? { current: bestPartial.target, target: bestPartial.target, label: bestPartial.region }
      : { current: bestPartial.current, target: bestPartial.target, label: bestPartial.region || undefined },
    HALF_ALBUM: count(completedRegions(mcdonalds, visits).length, 10),
    NORTH_SOUTH: count(northSouth, 2),
    ISLANDER: count(islands, 2),
    METROPOLITAN: count(METROPOLIS.filter(city => provinces.has(city)).length, METROPOLIS.length),
    PROVINCES_30: count(provinces.size, 30),
    AIRPORT: kind('Aeroporto'),
    STATION: kind('Stazione'),
    DRIVE: kind('Drive'),
    MALL: kind('Centro commerciale'),
    HIGHWAY: kind('Area di servizio'),
    ALL_KINDS: count(ALL_KINDS.filter(k => kinds.has(k)).length, ALL_KINDS.length),
    BEFORE_CLOSING: yes(beforeClosing),
    PIONEER: yes(pioneer),
    CRITIC: count(visits.filter(v => v.rating).length, 10),
    GPS_VERIFIED: count(visits.filter(v => v.verified).length, 25),
    NIGHT_OWL: yes(nightOwl),
    FERRAGOSTO: yes(ferragosto),
    DOUBLE: yes(doubleDay),
    LUCKY_77: count(visitedIds.size, 77),
  };
}

export async function checkAndUnlockAchievements(
  userId: string,
  mcdonalds: McDonald[],
  visits: Visit[],
): Promise<string[]> {
  const unlocked: string[] = [];
  const existing = await getAchievements(userId);
  const existingIds = new Set(existing.map(a => a.type));
  const progress = getAchievementProgress(mcdonalds, visits);

  for (const id of Object.keys(progress)) {
    if (existingIds.has(id)) continue;
    const { current, target } = progress[id];
    if (target > 0 && current >= target) {
      unlocked.push(id);
      await addAchievement({
        id: `ach_${Date.now()}_${id}`,
        userId,
        type: id,
        unlockedAt: Date.now(),
      });
    }
  }

  return unlocked;
}
