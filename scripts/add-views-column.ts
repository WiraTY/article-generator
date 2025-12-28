import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function migrate() {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
        console.error('TURSO_DATABASE_URL is not set');
        process.exit(1);
    }

    const client = createClient({ url, authToken });

    try {
        console.log('Adding views column to articles table...');
        await client.execute('ALTER TABLE articles ADD COLUMN views INTEGER DEFAULT 0 NOT NULL');
        console.log('✓ Migration successful: Added views column');
    } catch (e: any) {
        if (e.message?.includes('duplicate column name')) {
            console.log('Views column already exists, skipping.');
        } else {
            console.error('Migration failed:', e);
        }
    }
}

migrate();
