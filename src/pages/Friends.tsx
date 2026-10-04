import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { doneRegions, friendRegions, type Friend, type FriendNews } from '@/services/friends';
import { FoodIcon } from '@/components/FoodIcon';
import { RegionAlbum } from '@/components/RegionAlbum';
import { ItalyMap } from '@/components/ItalyMap';
import { Passport } from '@/components/Passport';
import { SectionTitle } from '@/components/SectionTitle';
import { LEVELS } from '@/utils/foodTheme';

type Order = 'visited' | 'verified' | 'regions';

const ORDERS: Array<{ value: Order; label: string }> = [
  { value: 'visited', label: 'Visitati' },
  { value: 'verified', label: 'Verificati' },
  { value: 'regions', label: 'Regioni finite' },
];

const levelOf = (n: number) => LEVELS[Math.min(LEVELS.length, Math.max(1, n)) - 1];

/** "oggi", "ieri", "3 giorni fa", then the date */
function ago(ms: number): string {
  const day = (t: number) => Math.floor((t - new Date(t).getTimezoneOffset() * 60000) / 86400000);
  const days = day(Date.now()) - day(ms);
  if (days <= 0) return 'oggi';
  if (days === 1) return 'ieri';
  if (days < 7) return `${days} giorni fa`;
  return new Date(ms).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

function score(f: Friend, order: Order): number[] {
  const { gold, diamond } = doneRegions(f);
  if (order === 'verified') return [f.verified, f.visited];
  if (order === 'regions') return [gold + diamond, diamond, f.visited];
  return [f.visited, f.verified];
}

function compare(a: Friend, b: Friend, order: Order): number {
  const sa = score(a, order);
  const sb = score(b, order);
  for (let i = 0; i < sa.length; i++) if (sa[i] !== sb[i]) return sb[i] - sa[i];
  return a.name.localeCompare(b.name);
}

const MEDALS = ['🥇', '🥈', '🥉'];

const unit = (order: Order, n: number) =>
  order === 'visited' ? 'Mc' : order === 'verified' ? (n === 1 ? 'verificato' : 'verificati') : n === 1 ? 'regione' : 'regioni';

export function Friends() {
  const { account, mcdonalds, friendsBoard: friends, checkFriends, markFriendsSeen } = useMcdonaldStore();
  const myId = account && account.status !== 'signed-out' ? account.account.id : null;
  // What was new when you opened the page: marked on the rows for as long as you stay here
  const [news, setNews] = useState<FriendNews[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>('visited');
  const [open, setOpen] = useState<Friend | null>(null);

  const load = useCallback(async () => {
    if (navigator.onLine === false) {
      setError('Sei offline: collegati a internet per vedere gli amici.');
      return;
    }
    try {
      const fresh = await checkFriends();
      setNews(before => [...before.filter(n => !fresh.some(f => f.userId === n.userId)), ...fresh]);
      markFriendsSeen();
      setError(null);
    } catch {
      setError('Non riesco a caricare gli amici. Riprova tra poco.');
    }
  }, [checkFriends, markFriendsSeen]);

  useEffect(() => {
    void load();
    const again = () => document.visibilityState === 'visible' && void load();
    document.addEventListener('visibilitychange', again);
    window.addEventListener('online', again);
    return () => {
      document.removeEventListener('visibilitychange', again);
      window.removeEventListener('online', again);
    };
  }, [load]);

  const ranked = useMemo(() => (friends ?? []).slice().sort((a, b) => compare(a, b, order)), [friends, order]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
      <SectionTitle emoji="🏆" className="">Classifica</SectionTitle>

      <div className="flex gap-0.5 rounded-2xl bg-gray-100 p-1 dark:bg-gray-800" role="radiogroup" aria-label="Ordina per">
        {ORDERS.map(o => (
          <button
            key={o.value}
            role="radio"
            aria-checked={order === o.value}
            onClick={() => setOrder(o.value)}
            className={`flex-1 rounded-xl py-1.5 text-sm font-semibold transition-all ${
              order === o.value ? 'bg-mc-red text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <p>{error}</p>
          <button onClick={() => void load()} className="mt-3 rounded-xl bg-mc-yellow px-4 py-2 font-bold text-gray-800 active:scale-95">
            Riprova
          </button>
        </div>
      )}

      {!error && friends === null && <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Un attimo…</p>}

      {!error && friends !== null && ranked.length <= 1 && (
        <p className="rounded-2xl bg-mc-yellow/20 p-4 text-center text-sm text-gray-700 dark:text-gray-200">
          Per ora ci sei solo tu. Quando entrano i tuoi amici li trovi qui, in classifica con te.
        </p>
      )}

      <ol className="flex flex-col gap-2.5">
        {ranked.map((f, i) => {
          const me = f.userId === myId;
          const level = levelOf(f.level);
          const { gold, diamond } = doneRegions(f);
          const value = order === 'verified' ? f.verified : order === 'regions' ? gold + diamond : f.visited;
          const what = news.find(n => n.userId === f.userId)?.kind;
          return (
            <li key={f.userId}>
              <button
                onClick={() => setOpen(f)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left shadow-sm transition-transform active:scale-[0.98] ${what ? 'ring-2 ring-mc-red ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-950' : ''} ${
                  me
                    ? 'border-mc-yellow bg-mc-yellow/15 dark:border-mc-yellow/60 dark:bg-mc-yellow/10'
                    : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
                }`}
              >
                <span className="w-7 flex-none text-center font-display text-lg font-bold text-gray-500 dark:text-gray-400">
                  {MEDALS[i] ?? i + 1}
                </span>
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-mc-red/10 dark:bg-mc-red/20">
                  <FoodIcon name={level.icon} size={30} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate font-display font-bold text-gray-800 dark:text-gray-100">{f.name}</span>
                    {me && <span className="rounded-full bg-mc-yellow px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-gray-800">Tu</span>}
                    {what && (
                      <span className="flex-none rounded-full bg-mc-red px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-white">
                        {what === 'joined' ? 'Nuovo' : what === 'passedYou' ? 'Ti ha superato' : 'Superato!'}
                      </span>
                    )}
                  </span>
                </span>
                {/* One number only, the one the list is ordered by: the rest is in the sheet */}
                <span className="flex-none text-right">
                  <span className="block font-display text-2xl font-bold leading-tight text-gray-800 dark:text-gray-100">{value}</span>
                  <span className="block text-[0.7rem] text-gray-500 dark:text-gray-400">{unit(order, value)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {open && <FriendSheet friend={open} me={open.userId === myId} mcdonalds={mcdonalds} onClose={() => setOpen(null)} />}
    </div>
  );
}

function FriendSheet({ friend, me, mcdonalds, onClose }: { friend: Friend; me: boolean; mcdonalds: Parameters<typeof friendRegions>[1]; onClose: () => void }) {
  const level = levelOf(friend.level);
  const { summaries, wasComplete, tiers } = useMemo(() => friendRegions(friend, mcdonalds), [friend, mcdonalds]);
  const unlocked = useMemo(() => new Set(friend.stamps), [friend.stamps]);
  // Out of the restaurants open today, as on everybody's Home
  const total = useMemo(() => mcdonalds.filter(mc => mc.opened).length, [mcdonalds]);

  return (
    <div className="fixed inset-0 z-[2100] flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={friend.name}
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-gray-200 bg-gray-50 shadow-2xl animate-[toast-in_0.25s_ease-out] dark:border-gray-800 dark:bg-gray-950"
        style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom))' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-mc-red to-red-700 px-5 pb-5 pt-4 text-white">
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-white"
          >
            ✕
          </button>
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md">
              <FoodIcon name={level.icon} size={40} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-2xl font-bold leading-tight">
                {friend.name}
                {me && <span className="ml-2 align-middle text-xs font-bold uppercase text-mc-yellow">Tu</span>}
              </p>
              <p className="text-sm text-white/85">
                Livello {friend.level} · {level.name}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-black/20 py-2">
              <p className="font-display text-2xl font-bold">{friend.visited}</p>
              <p className="text-[0.7rem] text-white/80">di {total} Mc</p>
            </div>
            <div className="rounded-2xl bg-black/20 py-2">
              <p className="font-display text-2xl font-bold">{friend.verified}</p>
              <p className="text-[0.7rem] text-white/80">{friend.verified === 1 ? 'verificato' : 'verificati'}</p>
            </div>
            <div className="rounded-2xl bg-black/20 py-2">
              <p className="font-display text-2xl font-bold">{friend.stamps.length}</p>
              <p className="text-[0.7rem] text-white/80">{friend.stamps.length === 1 ? 'timbro' : 'timbri'}</p>
            </div>
          </div>
          {friend.visits_total > friend.visited && (
            <p className="mt-3 text-sm text-white/90">🔁 {friend.visits_total} visite in tutto, ritorni compresi</p>
          )}
          {friend.last_visit && (
            <p className="mt-3 text-sm text-white/90">
              🍟 Ultimo Mc: <span className="font-semibold">{friend.last_visit.name.replace("McDonald's ", '')}</span> ({friend.last_visit.city}),{' '}
              {ago(friend.last_visit.at)}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-6 px-4 pt-5">
          <Passport unlocked={unlocked} unlockedAt={{}} progress={{}} focused={[]} />
          <section>
            <SectionTitle icon="mcflurry">Regioni</SectionTitle>
            <ItalyMap tiers={tiers} className="mx-auto mb-5 w-full max-w-[15rem]" />
            <RegionAlbum summaries={summaries} wasComplete={wasComplete} completedAt={{}} diamondAt={{}} />
          </section>
        </div>
      </div>
    </div>
  );
}
