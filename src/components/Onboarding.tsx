import { useRef, useState } from 'react';
import { useMcdonaldStore } from '@/store/mcdonaldStore';
import { FoodPattern } from '@/components/FoodPattern';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Stamp } from '@/components/Stamp';
import { RegionSticker } from '@/components/RegionSticker';
import { ACHIEVEMENTS } from '@/services/achievements';
import { SignInForm } from '@/components/SignInForm';

/** A restaurant card as it looks once visited, drawn for the guide (not a real, tappable one) */
function SampleCard() {
  return (
    <div className="w-64 rounded-2xl border border-green-300 bg-green-50 p-4 text-left shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-800">McDonald's Chieti</p>
          <p className="text-xs text-gray-500">Chieti, Abruzzo</p>
          <div className="mt-2 flex gap-1.5">
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[0.65rem] font-semibold text-green-800">📅 Visitato oggi</span>
            <span className="rounded-full bg-mc-yellow/30 px-2 py-0.5 text-[0.65rem] font-semibold text-yellow-800">★ 4.5</span>
          </div>
        </div>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 font-bold text-white ring-2 ring-white">
          ✓
        </span>
      </div>
    </div>
  );
}

interface Slide {
  title: string;
  text: string;
  art: React.ReactNode;
}

/**
 * The guide to the app: on a first launch (before the browser asks for the position, which it explains), or again
 * from the Profile. A few slides over the red card background, swiped or stepped with the buttons; then signing in
 * (required: the app keeps everything in the account) and a username. When only signing in is missing (an install
 * from before accounts, or a session gone) it opens straight on that step.
 */
export function Onboarding() {
  const { onboarding, finishOnboarding, mcdonalds, user, renameUser, account } = useMcdonaldStore();
  const [index, setIndex] = useState(0);
  const [name, setName] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const touchX = useRef<number | null>(null);

  if (onboarding !== 'first' && onboarding !== 'again' && onboarding !== 'signin') return null;
  const openCount = mcdonalds.filter(m => m.opened).length;

  const slides: Slide[] = [
    {
      title: 'Benvenuto su McDonaldz',
      text: `Tutti i ${openCount} McDonald's d'Italia, da collezionare uno per uno.`,
      art: (
        <img
          src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
          alt=""
          width={120}
          height={120}
          className="rounded-[28px] border-4 border-white/80 shadow-2xl"
        />
      ),
    },
    {
      title: 'Segna i Mc che visiti',
      text: 'Tocca un ristorante, vicino a te, nella lista o sulla mappa: diventa verde. Poi puoi votarlo e, se serve, cambiarne la data.',
      art: <SampleCard />,
    },
    {
      title: 'Se sei lì, vale di più',
      text: 'Segna la visita mentre sei al ristorante: il telefono controlla dove sei e la visita diventa verificata, con il sigillo blu. Alcuni timbri valgono solo così.',
      art: <VerifiedBadge size={110} />,
    },
    {
      title: 'Timbri, regioni e livelli',
      text: "Ogni visita ti fa salire di livello e riempie il passaporto di timbri. Completa una regione per la figurina d'oro, verificala tutta per quella di diamante.",
      art: (
        <div className="flex items-end gap-3">
          <div className="rounded-2xl bg-[#FBF4E2] p-2 shadow-lg">
            <Stamp def={ACHIEVEMENTS.FIRST_STAMP} state="got" size={64} />
          </div>
          <div className="w-20 -rotate-6 drop-shadow-lg">
            <RegionSticker summary={{ region: 'Abruzzo', total: 18, visited: 18, complete: true }} tier="gold" />
          </div>
          <div className="w-20 rotate-6 drop-shadow-lg">
            <RegionSticker summary={{ region: 'Molise', total: 4, visited: 4, complete: true }} tier="diamond" />
          </div>
        </div>
      ),
    },
  ];
  const accountStep = slides.length; // after the slides: signing in
  const last = slides.length + 1; // then the username
  const first = onboarding === 'signin' ? accountStep : 0;
  const total = last + 1 - first;
  const current = Math.max(index, first);
  const shownName = name ?? user?.name ?? '';
  const signedIn = account && account.status !== 'signed-out' ? account.account : null;
  // Forward only once signed in, and with a username
  const blocked = (current === accountStep && !signedIn) || (current === last && (!shownName.trim() || saving));

  const go = (to: number) => setIndex(Math.max(first, Math.min(signedIn ? last : accountStep, to)));
  const finish = async () => {
    if (shownName.trim() && shownName.trim() !== (user?.name ?? '')) {
      setSaving(true);
      try {
        await renameUser(shownName);
      } catch (error) {
        // With an account the name must be free
        setNameError((error as Error).message);
        return;
      } finally {
        setSaving(false);
      }
    }
    setIndex(0);
    setName(null);
    setNameError(null);
    finishOnboarding();
  };

  return (
    <div
      role="dialog"
      aria-label="Guida a McDonaldz"
      className="fixed inset-0 z-[2900] flex flex-col overflow-hidden bg-gradient-to-br from-mc-red to-red-800 text-white"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
      onTouchStart={e => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={e => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50 && !(dx < 0 && blocked)) go(current + (dx < 0 ? 1 : -1));
      }}
    >
      <FoodPattern opacity={0.16} />

      <div className="relative flex h-14 items-center justify-end px-4">
        {current < accountStep && (
          <button onClick={() => go(accountStep)} className="rounded-full px-3 py-1.5 text-sm font-semibold text-white/80 active:scale-95">
            Salta
          </button>
        )}
      </div>

      <div key={current} className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-8 text-center animate-[toast-in_0.35s_ease-out]">
        {current < accountStep ? (
          <>
            <div className="flex min-h-[150px] items-center justify-center">{slides[current].art}</div>
            <h2 className="mt-8 font-display text-2xl font-bold">{slides[current].title}</h2>
            <p className="mt-3 text-base leading-relaxed text-white/90">{slides[current].text}</p>
          </>
        ) : current === accountStep ? (
          <>
            <img
              src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
              alt=""
              width={88}
              height={88}
              className="rounded-[22px] border-4 border-white/80 shadow-2xl"
            />
            <h2 className="mt-6 font-display text-2xl font-bold">{onboarding === 'signin' ? 'Entra in McDonaldz' : 'Il tuo account'}</h2>
            {signedIn ? (
              <p className="mt-3 rounded-2xl bg-black/20 px-4 py-3 text-base text-white/90">
                ✓ Sei dentro come <span className="font-semibold">{signedIn.email}</span>
              </p>
            ) : (
              <div className="mt-3 w-full">
                <SignInForm onSignedIn={() => setIndex(last)} />
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold">{onboarding === 'again' ? 'Il tuo username' : 'Ultima cosa'}</h2>
            <p className="mt-3 text-base text-white/90">Scegli il tuo username: è solo tuo, è così che ti vedranno gli amici.</p>
            <input
              value={shownName}
              onChange={e => {
                setName(e.target.value);
                setNameError(null);
              }}
              maxLength={16}
              placeholder="Il tuo username"
              className="mt-5 w-full rounded-2xl border-2 border-white/40 bg-white px-4 py-3 text-center text-lg font-semibold text-gray-800 outline-none focus:border-mc-yellow"
            />
            {nameError && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-red-700">{nameError}</p>}
            {onboarding === 'first' && (
              <p className="mt-6 rounded-2xl bg-black/20 px-4 py-3 text-sm leading-relaxed text-white/90">
                📍 Subito dopo il telefono ti chiederà la posizione: serve per mostrarti i Mc vicini e per verificare le visite.
                Resta sul tuo telefono.
              </p>
            )}
          </>
        )}
      </div>

      <div className="relative mx-auto w-full max-w-md px-6 pb-6">
        <div className="mb-5 flex justify-center gap-2" aria-label={`Pagina ${current - first + 1} di ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i === current - first ? 'w-6 bg-mc-yellow' : 'w-2 bg-white/40'}`} />
          ))}
        </div>
        <div className="flex gap-3">
          {current > first && (
            <button onClick={() => go(current - 1)} className="flex-1 rounded-2xl bg-white/15 py-3.5 font-bold active:scale-[0.98]">
              Indietro
            </button>
          )}
          <button
            onClick={() => (current < last ? go(current + 1) : void finish())}
            disabled={blocked}
            className="flex-[2] rounded-2xl bg-mc-yellow py-3.5 font-bold text-gray-800 shadow-lg active:scale-[0.98] disabled:opacity-40"
          >
            {current < last ? 'Avanti' : onboarding === 'again' ? 'Fatto' : 'Inizia'}
          </button>
        </div>
      </div>
    </div>
  );
}
