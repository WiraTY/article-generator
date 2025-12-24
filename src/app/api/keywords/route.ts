import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { keywords } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { generateKeywords } from '@/lib/services/aiService';

let initialized = false;
async function ensureInit() {
    if (!initialized) {
        await initializeDatabase();
        initialized = true;
    }
}

// GET /api/keywords - Get all keywords
export async function GET() {
    await ensureInit();
    try {
        const allKeywords = await db.select().from(keywords).orderBy(desc(keywords.createdAt));
        return NextResponse.json(allKeywords);
    } catch (error: any) {
        console.error('Get keywords error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/keywords - Save keywords or research new ones
export async function POST(request: NextRequest) {
    await ensureInit();
    try {
        const body = await request.json();

        // If keywordsList is provided, save keywords
        if (body.keywordsList) {
            const { keywordsList } = body;
            const savedKeywords = [];

            for (const kw of keywordsList) {
                const result = await db.insert(keywords).values({
                    term: kw.term,
                    seedKeyword: kw.seedKeyword || kw.term,
                    intent: kw.intent,
                    status: 'new'
                }).returning();
                savedKeywords.push(result[0]);
            }

            return NextResponse.json(savedKeywords);
        }

        // If seedKeyword is provided, research keywords
        if (body.seedKeyword) {
            const { seedKeyword } = body;
            const generatedKeywords = await generateKeywords(seedKeyword);
            return NextResponse.json(generatedKeywords);
        }

        return NextResponse.json({ error: 'Missing keywordsList or seedKeyword' }, { status: 400 });
    } catch (error: any) {
        console.error('Keywords error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/keywords (with id in query params)
export async function DELETE(request: NextRequest) {
    await ensureInit();
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await db.delete(keywords).where(eq(keywords.id, parseInt(id)));
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete keyword error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
