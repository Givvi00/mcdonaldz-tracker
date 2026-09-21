// The visits live only in this browser. By default a browser may clear a site's storage when the device runs low on
// space; "persistent" storage is exempt from that. Chrome grants it on its own for installed apps and frequently used
// sites, Safari for apps added to the Home Screen; where it is not granted the only protection is a backup.

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

export async function persistState(): Promise<PersistState> {
  try {
    const storage = navigator.storage;
    if (!storage?.persisted) return 'unknown';
    return (await storage.persisted()) ? 'yes' : 'no';
  } catch {
    return 'unknown';
  }
}
