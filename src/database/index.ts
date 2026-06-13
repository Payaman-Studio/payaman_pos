import { open } from 'react-native-nitro-sqlite';
import { v4 as uuidv4 } from 'uuid';
import { CREATE_TABLES } from './schema';
import type { NitroSQLiteConnection } from 'react-native-nitro-sqlite';

let db: NitroSQLiteConnection | null = null;

export function getDatabase(): NitroSQLiteConnection {
  if (db) return db;

  db = open({ name: 'waroeng.db' });
  db.execute(CREATE_TABLES);

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function generateId(): string {
  return uuidv4();
}
