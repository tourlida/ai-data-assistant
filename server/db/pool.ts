import { Pool } from 'pg';
import { environment } from '../config';

export const pool = new Pool({ connectionString: environment.DATABASE_URL });

export async function checkDatabaseConnection(): Promise<void> {
  await pool.query('SELECT 1');
}

export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
}
