# Technical Specification: SEO-First AI Article Generator (Free Tier)

**Version:** 1.0.0
**Date:** December 2025
**Target Stack:** Node.js (Express), React (Vite), Drizzle ORM, SQLite.
**AI Engine:** Google Gemini API (Model: `gemini-1.5-flash`).
**Cost Strategy:** 100% Free Usage.

---

## 1. Project Goal
Build a web application that automates the creation of high-quality, SEO-optimized articles using free AI tools.
- **Admin Side:** Keyword research tool (Seed -> Long-tail + Intent), Article Generation, and Content Management.
- **User Side:** A professional, fast-loading blog interface optimized for readability and Core Web Vitals.

---

## 2. SEO & Content Standards (Strict Rules)
*The application logic must adhere to these SEO principles:*

1.  **Search Intent Focus:** Every generated keyword must be classified as 'Informational' or 'Transactional'.
2.  **E-E-A-T Structure:** Articles must be deep (800-1000 words), authoritative, and solution-oriented.
3.  **On-Page Optimization:**
    - **H1:** Must contain the exact target keyword.
    - **First 100 Words:** Must mention the target keyword naturally.
    - **Hierarchy:** Proper use of H2 for main points and H3 for details.
    - **Meta Description:** Custom generated summary (max 160 chars).
    - **URL Slug:** Clean, keyword-rich URLs (e.g., `/cara-membuat-kopi`).
4.  **Readability:** Short paragraphs (max 3-4 lines). Use bullet points and **bold** text for scanning.
5.  **Internal/External Linking:** AI should suggest authoritative external links (Wikipedia, News).

---

## 3. Tech Stack & Architecture

### Backend (Server)
- **Runtime:** Node.js (Express)
- **Database:** SQLite (`local.db`)
- **ORM:** Drizzle ORM (`drizzle-orm`, `drizzle-kit`)
- **AI Service:** Google Generative AI SDK (`@google/generative-ai`)
- **Helpers:** `slugify`, `cors`, `dotenv`, `helmet`

### Frontend (Client)
- **Framework:** React + Vite
- **Styling:** Tailwind CSS + `@tailwindcss/typography` (Critical for article rendering)
- **State:** React Query (TanStack Query)
- **SEO Head:** `react-helmet-async`
- **Routing:** React Router DOM

---

## 4. Database Schema (Drizzle ORM)

### Table: `keywords`
Stores ideas and research data.
- `id`: Integer (PK, Auto-increment)
- `term`: Text (The keyword string)
- `seed_keyword`: Text (Parent keyword)
- `intent`: Text (Enum: 'informational', 'transactional')
- `status`: Text (Default: 'new'. Options: 'new', 'draft', 'published')
- `created_at`: Timestamp

### Table: `articles`
Stores the final generated content.
- `id`: Integer (PK, Auto-increment)
- `keyword_id`: Integer (FK -> keywords.id)
- `title`: Text (H1)
- `slug`: Text (Unique, Indexed)
- `meta_description`: Text
- `content_html`: Text (Full HTML body content)
- `author`: Text (Default: 'Admin')
- `published_at`: Timestamp

---

## 5. AI Prompt Engineering Strategy
*Implement these prompts in the Backend Service layer.*

### Feature A: Keyword Research
**Input:** `seedKeyword`
**Model:** `gemini-1.5-flash`
**System Instruction:**
> "Act as an SEO Strategist. Analyze the seed keyword provided. Generate 10 high-potential long-tail keywords relevant to the seed. For each keyword, determine the User Search Intent (Informational or Transactional). Return strictly a JSON Array of objects: `[{ "term": "...", "intent": "..." }]`."

### Feature B: Article Generation (The SEO Master Prompt)
**Input:** `keyword`, `intent`
**Model:** `gemini-1.5-flash`
**System Instruction:**
> "You are an expert Content Writer using E-E-A-T standards. Write a comprehensive article for the keyword: '${keyword}'.
>
> **Strict Guidelines:**
> 1. **Title:** Catchy H1 title containing the keyword.
> 2. **Format:** Use HTML tags ONLY (<h2>, <h3>, <p>, <ul>, <li>, <strong>). DO NOT use markdown. DO NOT use <html>/<body> tags.
> 3. **Introduction:** Mention '${keyword}' in the first paragraph.
> 4. **Body:** 800-1000 words. Short paragraphs (3 sentences max). Use bullet points.
> 5. **Meta:** Create a compelling meta description (max 160 chars).
>
> **Output JSON Format:**
> {
>   "title": "...",
>   "meta_description": "...",
>   "content_html": "..."
> }"

---

## 6. Frontend UI/UX Specifications

### A. Admin Dashboard
1.  **Keyword Researcher:**
    - Input: Seed Keyword.
    - Action: Button "Analyze Intent".
    - Display: Table with checkboxes to select and save desired keywords to DB.
2.  **Content Manager:**
    - List of saved keywords.
    - Action: Button "Generate Article" (Show loading spinner, Gemini takes ~10-20s).
    - Edit Mode: A simple WYSIWYG editor (or Textarea) to refine HTML before publishing.

### B. Public Article Page
1.  **Visuals (No AI Image Gen):**
    - Use a **CSS Pattern Generator** or **Unsplash Source** based on the keyword for the Hero Image.
    - Example: `<img src="https://source.unsplash.com/random/1200x600/?${keyword}" />`
2.  **Typography:**
    - Wrapper: `<article className="prose prose-lg prose-blue mx-auto">`.
    - This automatically styles H2, H3, P, and Lists professionally.
3.  **SEO Tags:**
    - Inject `<title>` and `<meta name="description">` using `react-helmet-async`.

---

## 7. Implementation Roadmap (Step-by-Step)

1.  **Setup:**
    - Initialize Node.js project.
    - Install `express`, `drizzle-orm`, `better-sqlite3`, `@google/generative-ai`.
    - Setup Vite React frontend with Tailwind & Typography plugin.
2.  **Database:**
    - Define schema in `src/db/schema.ts`.
    - Run `drizzle-kit push:sqlite`.
3.  **Backend Logic:**
    - Create `services/aiService.js` to handle Gemini API calls with the Prompts defined above.
    - Create `routes/keywords.js` and `routes/articles.js`.
4.  **Frontend Admin:**
    - Build the Keyword Research UI -> Connect to API.
    - Build the Article Generation UI -> Connect to API.
5.  **Frontend Public:**
    - Build the Blog Home (Grid View).
    - Build the Single Article View (Prose View).