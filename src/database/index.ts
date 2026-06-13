import SQLite from 'react-native-sqlite-storage';
import { v4 as uuidv4 } from 'uuid';
import { CREATE_TABLES } from './schema';

SQLite.enablePromise(true);

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabase({
    name: 'waroeng.db',
    location: 'default',
  });

  await db.executeSql(CREATE_TABLES);

  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

export function generateId(): string {
  return uuidv4();
}
