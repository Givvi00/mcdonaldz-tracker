import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Visit, User, Achievement } from '@shared/types';

interface AppDB extends DBSchema {
  users: {
    key: string;
    value: User;
  };
  visits: {
    key: string;
    value: Visit;
    indexes: { 'by-mcdonaldId': string };
  };
  achievements: {
    key: string;
    value: Achievement;
    indexes: { 'by-userId': string };
  };
}

let db: IDBPDatabase<AppDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<AppDB>> {
  if (db) return db;

  db = await openDB<AppDB>('mcdonaldz-tracker', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('visits')) {
        const visitStore = db.createObjectStore('visits', { keyPath: 'id' });
        visitStore.createIndex('by-mcdonaldId', 'mcdonaldId');
      }
      if (!db.objectStoreNames.contains('achievements')) {
        const achStore = db.createObjectStore('achievements', { keyPath: 'id' });
        achStore.createIndex('by-userId', 'userId');
      }
    },
  });

  return db;
}

export async function getOrCreateUser(): Promise<User> {
  const database = await initDB();
  const allUsers = await database.getAll('users');

  if (allUsers.length > 0) {
    return allUsers[0];
  }

  const newUser: User = {
    id: 'user_' + Date.now(),
    createdAt: Date.now(),
    totalVisits: 0,
    totalPoints: 0,
  };

  await database.add('users', newUser);
  return newUser;
}

export async function addVisit(mcdonaldId: string, userId: string): Promise<Visit> {
  const database = await initDB();
  const visit: Visit = {
    id: 'visit_' + Date.now(),
    mcdonaldId,
    visitedAt: Date.now(),
  };

  await database.add('visits', visit);

  // Update user
  const user = await database.get('users', userId);
  if (user) {
    user.totalVisits += 1;
    user.totalPoints += 1;
    await database.put('users', user);
  }

  return visit;
}

export async function removeVisit(mcdonaldId: string, userId: string): Promise<void> {
  const database = await initDB();
  const index = await database.getFromIndex('visits', 'by-mcdonaldId', mcdonaldId);

  if (index) {
    await database.delete('visits', index.id);

    // Update user
    const user = await database.get('users', userId);
    if (user && user.totalVisits > 0) {
      user.totalVisits -= 1;
      user.totalPoints -= 1;
      await database.put('users', user);
    }
  }
}

export async function getVisits(): Promise<Visit[]> {
  const database = await initDB();
  return database.getAll('visits');
}

export async function getVisitsByMcdonaldId(mcdonaldId: string): Promise<Visit[]> {
  const database = await initDB();
  return database.getAllFromIndex('visits', 'by-mcdonaldId', mcdonaldId);
}

export async function addAchievement(achievement: Achievement): Promise<void> {
  const database = await initDB();
  await database.add('achievements', achievement);
}

export async function getAchievements(userId: string): Promise<Achievement[]> {
  const database = await initDB();
  return database.getAllFromIndex('achievements', 'by-userId', userId);
}

export async function exportData(): Promise<string> {
  const database = await initDB();
  const users = await database.getAll('users');
  const visits = await database.getAll('visits');
  const achievements = await database.getAll('achievements');

  return JSON.stringify({ users, visits, achievements }, null, 2);
}

export async function importData(jsonData: string): Promise<void> {
  const database = await initDB();
  const data = JSON.parse(jsonData);

  for (const user of data.users || []) {
    await database.put('users', user);
  }
  for (const visit of data.visits || []) {
    await database.put('visits', visit);
  }
  for (const achievement of data.achievements || []) {
    await database.put('achievements', achievement);
  }
}
