import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import bcrypt from 'bcryptjs';

// Get the path to the database file (stored at project root)
const dbPath = path.join(process.cwd(), 'local.db');
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Initialize database tables
export function initializeDatabase() {
  // Step 1: Create tables (without new columns for backwards compatibility)
  sqlite.exec(`
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

  // Step 2: Run migrations to add new columns
  try {
    sqlite.exec(`ALTER TABLE comments ADD COLUMN status TEXT DEFAULT 'approved'`);
    console.log('✓ Added status column to comments');
  } catch (e) { /* Column already exists */ }

  try {
    sqlite.exec(`ALTER TABLE comments ADD COLUMN approved_by INTEGER`);
    console.log('✓ Added approved_by column to comments');
  } catch (e) { /* Column already exists */ }

  try {
    sqlite.exec(`ALTER TABLE comments ADD COLUMN approved_at TEXT`);
    console.log('✓ Added approved_at column to comments');
  } catch (e) { /* Column already exists */ }

  try {
    sqlite.exec(`ALTER TABLE articles ADD COLUMN author_id INTEGER`);
    console.log('✓ Added author_id column to articles');
  } catch (e) { /* Column already exists */ }

  try {
    sqlite.exec(`ALTER TABLE articles ADD COLUMN previous_content_html TEXT`);
    console.log('✓ Added previous_content_html column to articles');
  } catch (e) { /* Column already exists */ }

  // Step 3: Create indexes on new columns (after migration)
  try {
    sqlite.exec(`CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status)`);
  } catch (e) { /* Index already exists or column missing */ }

  // Step 4: Seed default Super Admin if no users exist
  const userCount = sqlite.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 12);
    sqlite.prepare(`
            INSERT INTO users (email, password, name, role) 
            VALUES (?, ?, ?, ?)
        `).run('admin@admin.com', hashedPassword, 'Super Admin', 'super_admin');
    console.log('✓ Default Super Admin created: admin@admin.com / admin123');
  }

  console.log('✓ Database initialized');
}


