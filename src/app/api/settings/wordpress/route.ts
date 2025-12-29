import { db } from '@/lib/db';
import { wordpressSettings } from '@/lib/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function GET() {
    try {
        const settings = await db.select().from(wordpressSettings).limit(1);

        if (!settings.length) {
            return NextResponse.json({
                url: '',
                username: '',
                hasPassword: false
            });
        }

        const config = settings[0];
        return NextResponse.json({
            url: config.url,
            username: config.username,
            hasPassword: !!config.applicationPassword,
            defaultStatus: config.defaultStatus
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { url, username, applicationPassword, defaultStatus } = body;

        // Remove trailing slash from URL
        const cleanUrl = url.replace(/\/$/, '');

        const existing = await db.select().from(wordpressSettings).limit(1);

        if (existing.length > 0) {
            // Update existing
            await db.update(wordpressSettings)
                .set({
                    url: cleanUrl,
                    username,
                    // Only update password if provided (it might be empty on frontend if just updating other fields)
                    ...(applicationPassword ? { applicationPassword } : {}),
                    defaultStatus,
                    updatedAt: new Date().toISOString()
                })
                .where(eq(wordpressSettings.id, existing[0].id));
        } else {
            // Insert new
            await db.insert(wordpressSettings).values({
                url: cleanUrl,
                username,
                applicationPassword, // Required for first time
                defaultStatus
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Save WP settings error:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
