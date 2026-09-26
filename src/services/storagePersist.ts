// The app works from this browser's storage (the account keeps a copy online). By default a browser may clear a site's
// storage when the device runs low on space; "persistent" storage is exempt from that, so changes not yet sent and the
// session survive. Chrome grants it on its own for installed apps and frequently used sites, Safari for apps added to
// the Home Screen.

export type PersistState = 'yes' | 'no' | 'unknown';

/** Asks the browser not to clear our data. Safe to call at every launch: it does nothing once granted. */
export async function requestPersistentStorage(): Promise<PersistState> {
  try {
    const storage = navigator.storage;
    if (!storage?.persist || !storage.persisted) return 'unknown';
    if (await storage.persisted()) return 'yes';
    return (await storage.persist()) ? 'yes' : 'no';
  } catch {
    return 'unknown';
  }
}
