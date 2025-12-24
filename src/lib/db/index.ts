import { createClient, Client } from '@libsql/client';
import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from './schema';
import bcrypt from 'bcryptjs';

// Lazy-initialized Turso client (to avoid build-time errors when env vars are not set)
let client: Client | null = null;
let dbInstance: LibSQLDatabase<typeof schema> | null = null;

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      throw new Error('TURSO_DATABASE_URL is not set. Please configure your Turso database URL.');
    }
    client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export function getDb(): LibSQLDatabase<typeof schema> {
  if (!dbInstance) {
    dbInstance = drizzle(getClient(), { schema });
  }
  return dbInstance;
}

// For backwards compatibility (existing code uses `db`)
export const db = new Proxy({} as LibSQLDatabase<typeof schema>, {
  get(_, prop) {
    return (getDb() as any)[prop];
  },
});

// Initialize database tables (async for Turso)
export async function initializeDatabase() {
  const tursoClient = getClient();

  // Step 1: Create tables
  await tursoClient.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      term TEXT NOT NULL,
      seed_keyword TEXT NOT NULL,
      intent TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword_id INTEGER REFERENCES keywords(id),
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      meta_description TEXT,
      content_html TEXT NOT NULL,
      main_keyword TEXT,
      tags TEXT,
      image_url TEXT,
      image_alt TEXT,
      author TEXT NOT NULL DEFAULT 'Admin',
      published_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL REFERENCES articles(id),
      name TEXT NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
    CREATE INDEX IF NOT EXISTS idx_keywords_status ON keywords(status);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  // Step 2: Run migrations to add new columns (ignore errors if column exists)
  const migrations = [
    `ALTER TABLE comments ADD COLUMN status TEXT DEFAULT 'approved'`,
    `ALTER TABLE comments ADD COLUMN approved_by INTEGER`,
    `ALTER TABLE comments ADD COLUMN approved_at TEXT`,
    `ALTER TABLE articles ADD COLUMN author_id INTEGER`,
    `ALTER TABLE articles ADD COLUMN previous_content_html TEXT`,
  ];

  for (const migration of migrations) {
    try {
      await tursoClient.execute(migration);
    } catch { /* Column already exists */ }
  }

  // Step 3: Create indexes on new columns
  try {
    await tursoClient.execute(`CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status)`);
  } catch { /* Index already exists */ }

  // Step 4: Seed default Super Admin if no users exist
  const result = await tursoClient.execute('SELECT COUNT(*) as count FROM users');
  const userCount = result.rows[0]?.count as number;

  if (userCount === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 12);
    await tursoClient.execute({
      sql: 'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      args: ['admin@admin.com', hashedPassword, 'Super Admin', 'super_admin'],
    });
    console.log('✓ Default Super Admin created: admin@admin.com / admin123');
  }

  console.log('✓ Database initialized');
}



