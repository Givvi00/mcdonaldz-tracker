import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { installHint, type InstallHint } from '@/utils/install';
import { isMobileDevice } from '@/utils/platform';

// Chrome's install offer. It is not in the standard DOM typings.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach(fn => fn());

/** Must run before the app renders: the browser may fire beforeinstallprompt very early and only once. */
export function initInstallCapture() {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); // keep it, so our own "Installa" button can trigger it
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export function useInstall(): { hint: InstallHint; mobile: boolean; promptInstall: () => Promise<void> } {
  const [, refresh] = useState(0);

  useEffect(() => {
    const update = () => refresh(n => n + 1);
    subscribers.add(update);
    const displayMode = window.matchMedia('(display-mode: standalone)');
    displayMode.addEventListener('change', update);
    return () => {
      subscribers.delete(update);
      displayMode.removeEventListener('change', update);
    };
  }, []);

  const promptInstall = async () => {
    const event = deferredPrompt;
    if (!event) return;
    deferredPrompt = null; // a browser offers it once
    notify();
    await event.prompt();
    await event.userChoice;
  };

  return {
    hint: installHint({
      ua: navigator.userAgent,
      maxTouchPoints: navigator.maxTouchPoints,
      standalone: isStandalone(),
      native: Capacitor.isNativePlatform(),
      hasPrompt: deferredPrompt !== null,
    }),
    mobile: isMobileDevice(navigator.userAgent, navigator.maxTouchPoints),
    promptInstall,
  };
}
