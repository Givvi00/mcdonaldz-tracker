import { isAndroid, isAppleTouchDevice, isInAppBrowser } from '@/utils/platform';

/**
 * What to tell the user about installing the web app on their home screen:
 * - installed: already running as an installed app, nothing to do
 * - prompt: the browser offers a one-tap install (Chrome on Android and desktop)
 * - ios: iPhone/iPad, where installing is Share → Add to Home Screen
 * - android-manual: Android without a one-tap offer, so the browser menu is needed
 * - inapp: inside another app's browser, which cannot install anything: open it in the real browser first
 * - none: nothing useful to show (the Android app, or a desktop browser without an install offer)
 */
export type InstallHint = 'installed' | 'prompt' | 'ios' | 'android-manual' | 'inapp' | 'none';

export interface InstallEnv {
  ua: string;
  maxTouchPoints: number;
  /** Already running as an installed app (display-mode: standalone, or iOS navigator.standalone) */
  standalone: boolean;
  /** Running inside the Capacitor Android/iOS shell */
  native: boolean;
  /** The browser fired beforeinstallprompt and we kept the event */
  hasPrompt: boolean;
}

export function installHint(env: InstallEnv): InstallHint {
  if (env.native) return 'none';
  if (env.standalone) return 'installed';
  if (isInAppBrowser(env.ua)) return 'inapp';
  if (env.hasPrompt) return 'prompt';
  if (isAppleTouchDevice(env.ua, env.maxTouchPoints)) return 'ios';
  if (isAndroid(env.ua)) return 'android-manual';
  return 'none';
}
