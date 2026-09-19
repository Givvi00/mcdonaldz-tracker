/** iPhone, iPad and iPod. Since iPadOS 13 the iPad asks for the desktop site and reports itself as a Mac, so a touch screen gives it away. */
export function isAppleTouchDevice(ua: string, maxTouchPoints: number): boolean {
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && maxTouchPoints > 1);
}

/** Chrome, Firefox, Edge or Opera on iPhone/iPad: they all sit on Apple's engine but only Safari reliably offers "Add to Home Screen". */
export function isIosOtherBrowser(ua: string): boolean {
  return /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

/** Browsers embedded in other apps (Facebook, Instagram, TikTok…) and Android WebViews: they cannot install a web app. */
export function isInAppBrowser(ua: string): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|Snapchat|TikTok|MicroMessenger|Line\/|; wv\)/.test(ua);
}

export function isAndroid(ua: string): boolean {
  return /Android/i.test(ua);
}

export function isMobileDevice(ua: string, maxTouchPoints: number): boolean {
  return isAppleTouchDevice(ua, maxTouchPoints) || isAndroid(ua) || /Mobile/i.test(ua);
}

/**
 * Link that asks iOS to open a web address in Safari. It uses Safari's own (undocumented) x-safari-https scheme, so
 * it is a best effort: other browsers may ignore it, which is why a copy-link fallback stays next to it.
 */
export function safariUrl(url: string): string | null {
  return /^https?:\/\//.test(url) ? 'x-safari-' + url : null;
}
