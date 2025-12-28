import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { db, initializeDatabase } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Z.AI API Key from environment (SECURE - not stored in database)
const ZAI_API_KEY = process.env.ZAI_API_KEY || '';

// Z.AI client (lazy init)
let zaiClient: OpenAI | null = null;
function getZaiClient(): OpenAI {
    if (!zaiClient) {
        if (!ZAI_API_KEY) {
            throw new Error('ZAI_API_KEY is not configured in environment variables');
        }
        zaiClient = new OpenAI({
            apiKey: ZAI_API_KEY,
            baseURL: 'https://api.z.ai/api/coding/paas/v4/' // GLM Coding endpoint
        });
    }
    return zaiClient;
}

/**
 * Get current AI provider setting from database (only provider selection, not API key)
 */
async function getAIProvider(): Promise<string> {
    try {
        await initializeDatabase();
        const result = await db.select().from(settings).where(eq(settings.key, 'aiProvider'));
        if (result[0]?.value) {
            // Handle both old format {provider, zaiApiKey} and new format (just provider string)
            try {
                const parsed = JSON.parse(result[0].value);
                const provider = typeof parsed === 'string' ? parsed : parsed.provider;
                console.log('[AI Provider] Current setting:', provider);
                return provider || 'gemini';
            } catch {
                console.log('[AI Provider] Using value as-is:', result[0].value);
                return result[0].value;
            }
        }
    } catch (e) {
        console.log('[AI Provider] Settings not found, using default: gemini');
    }
    return 'gemini';
}

/**
 * Strip HTML tags from a string
 */
function stripHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Fix malformed links in content
 */
function fixMalformedLinks(content: string): string {
    if (!content) return '';
    content = content.replace(/\[(https?:\/\/[^\]|]+)\|([^\]]+)\]/g, '<a href="$1">$2</a>');
    content = content.replace(/\[([^\]|]+)\|(https?:\/\/[^\]]+)\]/g, '<a href="$2">$1</a>');
    content = content.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1</a>');
    content = content.replace(/\[(https?:\/\/[^\]]+)\]/g, '<a href="$1">$1</a>');
    return content;
}

interface Keyword {
    term: string;
    intent: 'informational' | 'transactional';
}

interface Article {
    title: string;
    meta_description: string;
    tags: string[];
    content_html: string;
}

/**
 * Build the standard prompt for article generation
 * @param useCustomOnly - If true and customPrompt is provided, use only the custom prompt
 */
function buildArticlePrompt(keyword: string, intent: string, customPrompt: string, productKnowledge: string, useCustomOnly: boolean = false): string {
    // If useCustomOnly mode and custom prompt is provided, use it as the entire prompt
    if (useCustomOnly && customPrompt && customPrompt.trim()) {
        // Replace placeholders in custom prompt
        let prompt = customPrompt
            .replace(/\{keyword\}/gi, keyword)
            .replace(/\{intent\}/gi, intent);

        // Add product knowledge if available
        if (productKnowledge) {
            prompt += `\n\n**Product Knowledge (gunakan informasi ini dalam artikel):**\n${productKnowledge}`;
        }

        // Add JSON output format reminder
        prompt += `\n\n**FORMAT OUTPUT (WAJIB):**
Return ONLY a valid JSON object:
{
  "title": "Judul artikel",
  "meta_description": "Deskripsi meta 120-160 karakter",
  "tags": ["tag1", "tag2"],
  "content_html": "<h2>...</h2><p>...</p>"
}`;
        return prompt;
    }

    const productSection = productKnowledge
        ? `\n**IMPORTANT - Product Knowledge (use this factual information in the article):**\n${productKnowledge}\n`
        : '';

    // Integrate custom prompt as content/style guidance, not as a separate instruction
    const customSection = customPrompt
        ? `\n**Content Improvement Notes (apply these when writing the article):**\n${customPrompt}\n`
        : '';

    return `You are an expert Content Writer using E-E-A-T standards. Write a comprehensive article for the keyword: "${keyword}".
The search intent is: ${intent}.
${productSection}${customSection}
**TONE & STYLE (VERY IMPORTANT):**
- Target audience: Young adults (Gen Z and Millennials) in Indonesia
- Use CASUAL, friendly, and conversational Indonesian language
- NEVER use formal "Anda" - use "kamu" or speak directly without pronouns
- Avoid stiff corporate language. Be relatable and engaging
- Use simple, punchy sentences. Inject personality
- OK to use light slang or Gen Z expressions naturally (but don't overdo it)

**SEO REQUIREMENTS (CRITICAL - Follow these for high SEO score):**
1. **Keyword in Title:** The title MUST contain the keyword "${keyword}" naturally.
2. **Keyword in Meta Description:** The meta description MUST include "${keyword}".
3. **Keyword in Introduction:** Mention "${keyword}" within the first 100 words/first paragraph.
4. **Keyword Density:** Use "${keyword}" naturally throughout the article (aim for 1-2% density, roughly 8-15 times for 800-1000 words).
5. **Heading Structure:** Use at least 4-5 <h2> headings and some <h3> subheadings.
6. **Meta Description Length:** Keep between 120-160 characters.
7. **Include Links:** Add 1-2 relevant external links using proper HTML: <a href="https://example.com">anchor text</a>.

**READABILITY REQUIREMENTS (CRITICAL - Follow these for high readability score):**
1. **Short Sentences:** Keep sentences under 20 words on average. Prefer 15 words or less.
2. **Short Paragraphs:** Maximum 3 sentences per paragraph. Keep paragraphs under 100 words.
3. **Use Active Voice:** Minimize passive voice (avoid "di-", "ter-", "ke-...-an" patterns in Indonesian).
4. **Transition Words:** Start paragraphs with transition words like: "Selain itu,", "Namun,", "Jadi,", "Nah,", "Pertama,", "Selanjutnya,", "Karena itu,", "Meskipun,", etc.
5. **Content Length:** Write 800-1200 words total.

**Strict Guidelines:**
1. **Title:** Create a catchy H1 title that contains the keyword "${keyword}". Make it compelling and click-worthy. PLAIN TEXT ONLY, no HTML tags.
2. **Format:** Use HTML tags ONLY (<h2>, <h3>, <p>, <ul>, <li>, <strong>, <a>) for content_html. DO NOT use markdown. DO NOT use <html>, <head>, or <body> tags.
3. **IMPORTANT - Links/Anchor Text:** If you include links, ALWAYS use proper HTML anchor format: <a href="https://example.com">anchor text</a>. NEVER use wiki-style [url|text] or markdown [text](url) format.
4. **Introduction:** Mention "${keyword}" naturally in the first paragraph. Hook the reader immediately.
5. **Body:** Write 800-1200 words. Keep paragraphs short (3 sentences max). Use bullet points for lists. Use <strong> for important terms.
6. **Structure:** Use <h2> for main sections and <h3> for subsections. Create at least 4-5 main sections.
7. **Meta Description:** MUST be PLAIN TEXT ONLY (no HTML tags like <strong>, <p>, etc). 120-160 characters. Include the keyword naturally. Keep it casual too!
8. **Tags:** Generate 3-5 relevant tags/labels for this article. Tags should be short (1-2 words each), lowercase, and relevant to the content.

**CRITICAL OUTPUT FORMAT - YOU MUST FOLLOW THIS EXACTLY:**
Return ONLY a valid JSON object. No explanations, no apologies, no extra text. Just the JSON:
{
  "title": "Your compelling title here (plain text, no HTML)",
  "meta_description": "Your meta description here - PLAIN TEXT ONLY, 120-160 chars, NO HTML TAGS",
  "tags": ["tag1", "tag2", "tag3"],
  "content_html": "<h2>First Section</h2><p>Content here...</p>..."
}

REMINDER: Your entire response must be valid JSON only. Do not include any text before or after the JSON object.`;
}



/**
 * Build the standard prompt for keyword generation
 */
function buildKeywordPrompt(seedKeyword: string, customPrompt?: string): string {
    // JSON format instruction that's always appended
    const jsonFormatInstruction = `

**FORMAT OUTPUT (WAJIB - HARUS DIIKUTI):**
Return ONLY a valid JSON Array. No explanations, no apologies, no extra text. Just the JSON array:
[{ "term": "keyword here", "intent": "informational" }, { "term": "another keyword", "intent": "transactional" }]

The intent must be lowercase: either "informational" or "transactional".
REMINDER: Your entire response must be valid JSON array only. Do not include any text before or after the JSON.`;

    // If custom prompt provided, use it + append JSON format
    if (customPrompt && customPrompt.trim()) {
        const prompt = customPrompt.replace(/\{keyword\}/gi, seedKeyword).replace(/\{seed\}/gi, seedKeyword);
        return prompt + jsonFormatInstruction;
    }

    return `Act as an SEO Strategist. Analyze the seed keyword provided: "${seedKeyword}".

Generate 10 high-potential long-tail keywords relevant to the seed. For each keyword, determine the User Search Intent (Informational or Transactional).

Return ONLY a valid JSON Array of objects with no additional text or explanation. Format:
[{ "term": "keyword here", "intent": "informational" }, { "term": "another keyword", "intent": "transactional" }]

The intent must be lowercase: either "informational" or "transactional".`;
}

/**
 * Extract JSON from AI response (handle markdown code blocks and edge cases)
 */
function extractJson(text: string): string {
    let jsonStr = text.trim();

    // Try to extract from markdown code blocks first
    if (text.includes('```json')) {
        jsonStr = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
        jsonStr = text.split('```')[1].split('```')[0].trim();
    }

    // If response starts with HTML or non-JSON, try to find JSON object
    if (jsonStr.startsWith('<') || jsonStr.startsWith('Maaf') || jsonStr.startsWith('Sorry')) {
        // Try to find a JSON object in the text
        const jsonMatch = text.match(/\{[\s\S]*"title"[\s\S]*"content_html"[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        } else {
            throw new Error('AI response is not valid JSON. Please try again. Response started with: ' + jsonStr.substring(0, 50));
        }
    }

    // Clean up any leading/trailing non-JSON characters
    const firstBrace = jsonStr.indexOf('{');
    const firstBracket = jsonStr.indexOf('[');
    const startIndex = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket) ? firstBrace : firstBracket;

    if (startIndex > 0) {
        jsonStr = jsonStr.substring(startIndex);
    }

    // Find the matching closing brace/bracket
    if (jsonStr.startsWith('{')) {
        const lastBrace = jsonStr.lastIndexOf('}');
        if (lastBrace !== -1) {
            jsonStr = jsonStr.substring(0, lastBrace + 1);
        }
    } else if (jsonStr.startsWith('[')) {
        const lastBracket = jsonStr.lastIndexOf(']');
        if (lastBracket !== -1) {
            jsonStr = jsonStr.substring(0, lastBracket + 1);
        }
    }

    return jsonStr;
}

/**
 * Post-process article response
 */
function postProcessArticle(article: Article): Article {
    if (article.meta_description) {
        article.meta_description = stripHtml(article.meta_description);
        if (article.meta_description.length > 160) {
            article.meta_description = article.meta_description.substring(0, 157) + '...';
        }
    }
    if (article.title) {
        article.title = stripHtml(article.title);
    }
    if (article.content_html) {
        article.content_html = fixMalformedLinks(article.content_html)
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ');
    }
    return article;
}

// ==================== GEMINI PROVIDER ====================

async function generateKeywordsWithGemini(seedKeyword: string, customPrompt?: string): Promise<Keyword[]> {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const result = await model.generateContent(buildKeywordPrompt(seedKeyword, customPrompt));
    const response = await result.response;
    const text = response.text();
    return JSON.parse(extractJson(text));
}

async function generateArticleWithGemini(
    keyword: string, intent: string, customPrompt: string, productKnowledge: string, useCustomOnly: boolean = false
): Promise<Article> {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const result = await model.generateContent(buildArticlePrompt(keyword, intent, customPrompt, productKnowledge, useCustomOnly));
    const response = await result.response;
    const text = response.text();
    return postProcessArticle(JSON.parse(extractJson(text)));
}

// ==================== Z.AI PROVIDER ====================

async function generateKeywordsWithZai(seedKeyword: string, customPrompt?: string): Promise<Keyword[]> {
    const client = getZaiClient();
    const completion = await client.chat.completions.create({
        model: 'glm-4.7',
        messages: [
            { role: 'system', content: 'You are an SEO expert. You MUST respond with ONLY a valid JSON array, no explanations or additional text.' },
            { role: 'user', content: buildKeywordPrompt(seedKeyword, customPrompt) }
        ],
        temperature: 0.7
    });
    const text = completion.choices[0]?.message?.content || '[]';
    console.log('[Z.AI Keywords] Raw response length:', text.length);
    try {
        return JSON.parse(extractJson(text));
    } catch (e) {
        console.error('[Z.AI Keywords] JSON parse error:', text.substring(0, 200));
        throw new Error('Z.AI returned invalid JSON. Please try again.');
    }
}

async function generateArticleWithZai(
    keyword: string, intent: string, customPrompt: string, productKnowledge: string, useCustomOnly: boolean = false
): Promise<Article> {
    const client = getZaiClient();
    const completion = await client.chat.completions.create({
        model: 'glm-4.7',
        messages: [
            {
                role: 'system',
                content: `You are an expert content writer. You MUST respond with ONLY a valid JSON object.
CRITICAL: Your entire response must be ONLY the JSON object - no text before or after it.
The JSON must have these exact keys: "title", "meta_description", "tags", "content_html".
Do not include any explanations, markdown formatting, or code blocks. Just pure JSON.`
            },
            { role: 'user', content: buildArticlePrompt(keyword, intent, customPrompt, productKnowledge, useCustomOnly) }
        ],
        temperature: 0.5,  // Lower for more consistent JSON output
        response_format: { type: 'json_object' }  // Force JSON mode
    });
    const text = completion.choices[0]?.message?.content || '{}';
    console.log('[Z.AI Article] Raw response length:', text.length);
    console.log('[Z.AI Article] Response preview:', text.substring(0, 200));
    try {
        return postProcessArticle(JSON.parse(extractJson(text)));
    } catch (e) {
        console.error('[Z.AI Article] JSON parse error. Full response:', text);
        throw new Error('Z.AI returned invalid JSON format. Please try again or switch to Gemini.');
    }
}

// ==================== PUBLIC API ====================

/**
 * Generate long-tail keywords from a seed keyword
 * @param seedKeyword - The seed keyword to generate variations from
 * @param customPrompt - Optional custom prompt (replaces default if provided)
 */
export async function generateKeywords(seedKeyword: string, customPrompt?: string): Promise<Keyword[]> {
    try {
        const provider = await getAIProvider();

        if (provider === 'zai' && ZAI_API_KEY) {
            console.log('Using Z.AI for keyword generation');
            return await generateKeywordsWithZai(seedKeyword, customPrompt);
        } else {
            console.log('Using Gemini for keyword generation');
            return await generateKeywordsWithGemini(seedKeyword, customPrompt);
        }
    } catch (error: any) {
        console.error('Error generating keywords:', error);
        throw new Error('Failed to generate keywords: ' + error.message);
    }
}

/**
 * Generate an SEO-optimized article for a keyword
 * @param useCustomOnly - If true, use customPrompt as the entire prompt (replaces default)
 */
export async function generateArticle(
    keyword: string,
    intent: string,
    customPrompt: string = '',
    productKnowledge: string = '',
    useCustomOnly: boolean = false
): Promise<Article> {
    try {
        const provider = await getAIProvider();

        if (provider === 'zai' && ZAI_API_KEY) {
            console.log('Using Z.AI for article generation');
            return await generateArticleWithZai(keyword, intent, customPrompt, productKnowledge, useCustomOnly);
        } else {
            console.log('Using Gemini for article generation');
            return await generateArticleWithGemini(keyword, intent, customPrompt, productKnowledge, useCustomOnly);
        }
    } catch (error: any) {
        console.error('Error generating article:', error);
        throw new Error('Failed to generate article: ' + error.message);
    }
}
