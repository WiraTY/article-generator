import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table - stores admin and author accounts
export const users = sqliteTable('users', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull().unique(),
    password: text('password').notNull(), // Hashed with bcrypt
    name: text('name').notNull(),
    role: text('role').notNull().default('user'), // 'super_admin', 'author', 'user'
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Keywords table - stores keyword research data
export const keywords = sqliteTable('keywords', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    term: text('term').notNull(),
    seedKeyword: text('seed_keyword').notNull(),
    intent: text('intent').notNull(), // 'informational' or 'transactional'
    status: text('status').default('new').notNull(), // 'new', 'draft', 'published'
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Articles table - stores generated articles
export const articles = sqliteTable('articles', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    keywordId: integer('keyword_id').references(() => keywords.id),
    authorId: integer('author_id').references(() => users.id), // Who created the article
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    metaDescription: text('meta_description'),
    contentHtml: text('content_html').notNull(),
    previousContentHtml: text('previous_content_html'), // For regenerate undo
    mainKeyword: text('main_keyword'), // Primary keyword for SEO display
    tags: text('tags'), // JSON array of tags (auto-generated + manual)
    imageUrl: text('image_url'), // Custom featured image URL
    imageAlt: text('image_alt'), // Custom alt text for image
    author: text('author'),
    publishedAt: integer('published_at', { mode: 'timestamp' }),
    views: integer('views').default(0).notNull(),
});

// Comments table - stores article comments with moderation
export const comments = sqliteTable('comments', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    articleId: integer('article_id').references(() => articles.id).notNull(),
    name: text('name').notNull(),
    comment: text('comment').notNull(),
    status: text('status').notNull().default('pending'), // 'pending', 'approved', 'rejected'
    approvedBy: integer('approved_by').references(() => users.id),
    approvedAt: text('approved_at'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Settings table - stores global settings like product knowledge
export const settings = sqliteTable('settings', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    key: text('key').notNull().unique(),
    value: text('value').notNull(),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Generation Jobs table - stores background article generation jobs
export const generationJobs = sqliteTable('generation_jobs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    jobType: text('job_type').notNull().default('generate'), // 'generate' or 'regenerate'
    keywordId: integer('keyword_id').references(() => keywords.id),
    keyword: text('keyword').notNull(),
    intent: text('intent').notNull(),
    customPrompt: text('custom_prompt'),
    useCustomOnly: integer('use_custom_only', { mode: 'boolean' }).default(false), // Use custom prompt as entire prompt
    articleSlug: text('article_slug'), // For regenerate jobs - which article to update
    status: text('status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed', 'cancelled'
    articleId: integer('article_id').references(() => articles.id),
    error: text('error'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
