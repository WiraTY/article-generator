import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename with .webp extension
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${Date.now()}-${baseName}.webp`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        const filepath = path.join(uploadDir, filename);

        // Ensure uploads directory exists
        const { mkdir } = await import('fs/promises');
        await mkdir(uploadDir, { recursive: true });

        // Convert to WebP and resize if needed (max 1920px width for performance)
        const webpBuffer = await sharp(buffer)
            .resize(1920, null, {
                withoutEnlargement: true,
                fit: 'inside'
            })
            .webp({ quality: 85 })
            .toBuffer();

        // Write file
        await writeFile(filepath, webpBuffer);

        // Return the public URL
        const url = `/uploads/${filename}`;
        return NextResponse.json({ url, filename });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
