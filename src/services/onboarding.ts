// The first-launch guide is shown once. Remembered on the device; someone who already has visits (an older install)
// counts as having seen it, so the guide never lands on a phone that is already in use.

const KEY = 'mcdz-onboarded';

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    // storage unavailable: better not to show the guide at every launch
    return true;
  }
}

export function markOnboarded(): void {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    // storage unavailable: nothing to remember
  }
}
