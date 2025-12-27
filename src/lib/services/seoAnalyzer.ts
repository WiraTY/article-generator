/**
 * SEO & Readability Analyzer Service
 * Yoast SEO-like analysis for articles
 */

// ==================== TYPES ====================

export interface SEOCheck {
    id: string;
    label: string;
    passed: boolean;
    score: number;
    maxScore: number;
    message: string;
    severity: 'good' | 'ok' | 'bad';
}

export interface SEOAnalysis {
    score: number;
    maxScore: number;
    percentage: number;
    status: 'good' | 'ok' | 'bad';
    checks: SEOCheck[];
}

export interface ReadabilityCheck {
    id: string;
    label: string;
    passed: boolean;
    score: number;
    maxScore: number;
    message: string;
    severity: 'good' | 'ok' | 'bad';
    value?: number;
}

export interface ReadabilityAnalysis {
    score: number;
    maxScore: number;
    percentage: number;
    status: 'good' | 'ok' | 'bad';
    checks: ReadabilityCheck[];
    stats: {
        wordCount: number;
        sentenceCount: number;
        paragraphCount: number;
        avgWordsPerSentence: number;
        avgWordsPerParagraph: number;
    };
}

// ==================== HELPERS ====================

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Count words in text
 */
function countWords(text: string): number {
    const cleaned = stripHtml(text);
    if (!cleaned) return 0;
    return cleaned.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Get sentences from text
 */
function getSentences(text: string): string[] {
    const cleaned = stripHtml(text);
    if (!cleaned) return [];
    // Split by sentence-ending punctuation, handle Indonesian patterns
    return cleaned
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

/**
 * Get paragraphs from HTML content
 */
function getParagraphs(html: string): string[] {
    if (!html) return [];
    // Extract text between <p> tags or split by double newlines
    const pMatches = html.match(/<p[^>]*>(.*?)<\/p>/gi) || [];
    if (pMatches.length > 0) {
        return pMatches.map(p => stripHtml(p)).filter(p => p.length > 0);
    }
    // Fallback: split by double newlines
    return stripHtml(html).split(/\n\n+/).filter(p => p.length > 0);
}

/**
 * Count keyword occurrences (case insensitive)
 */
function countKeywordOccurrences(text: string, keyword: string): number {
    if (!text || !keyword) return 0;
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return (text.match(regex) || []).length;
}

/**
 * Calculate keyword density percentage
 */
function calculateKeywordDensity(text: string, keyword: string): number {
    const wordCount = countWords(text);
    if (wordCount === 0) return 0;
    const keywordCount = countKeywordOccurrences(text, keyword);
    const keywordWords = keyword.split(/\s+/).length;
    return (keywordCount * keywordWords / wordCount) * 100;
}

/**
 * Check if text contains passive voice patterns (Indonesian)
 */
function countPassiveVoice(text: string): number {
    const cleaned = stripHtml(text);
    // Indonesian passive patterns: di-, ter-, ke-...-an
    const passivePatterns = [
        /\bdi\w+kan\b/gi,
        /\bdiper\w+\b/gi,
        /\bditer\w+\b/gi,
        /\bter\w+\b/gi,
        /\bke\w+an\b/gi,
    ];
    let count = 0;
    passivePatterns.forEach(pattern => {
        count += (cleaned.match(pattern) || []).length;
    });
    return count;
}

/**
 * Indonesian transition words
 */
const TRANSITION_WORDS = [
    'selain itu', 'namun', 'tetapi', 'akan tetapi', 'meskipun', 'walaupun',
    'karena', 'oleh karena itu', 'sehingga', 'akibatnya', 'dengan demikian',
    'pertama', 'kedua', 'ketiga', 'selanjutnya', 'kemudian', 'akhirnya',
    'misalnya', 'contohnya', 'seperti', 'yaitu', 'yakni',
    'jadi', 'maka', 'oleh sebab itu', 'dengan kata lain', 'singkatnya',
    'secara keseluruhan', 'pada umumnya', 'biasanya', 'sebaliknya',
    'di sisi lain', 'bahkan', 'terlebih lagi', 'apalagi', 'lagipula',
    'nah', 'jadi intinya', 'kesimpulannya', 'pada intinya'
];

/**
 * Count paragraphs with transition words
 */
function countTransitionParagraphs(html: string): { total: number; withTransition: number } {
    const paragraphs = getParagraphs(html);
    let withTransition = 0;

    paragraphs.forEach(p => {
        const lower = p.toLowerCase();
        if (TRANSITION_WORDS.some(tw => lower.includes(tw))) {
            withTransition++;
        }
    });

    return { total: paragraphs.length, withTransition };
}

/**
 * Get status from percentage
 */
function getStatus(percentage: number): 'good' | 'ok' | 'bad' {
    if (percentage >= 80) return 'good';
    if (percentage >= 50) return 'ok';
    return 'bad';
}

// ==================== SEO ANALYSIS ====================

export function analyzeSEO(
    article: {
        title: string;
        metaDescription: string;
        contentHtml: string;
        imageAlt?: string;
    },
    keyword: string
): SEOAnalysis {
    const checks: SEOCheck[] = [];
    const plainContent = stripHtml(article.contentHtml);
    const wordCount = countWords(plainContent);

    // 1. Keyword in Title (20 points)
    const keywordInTitle = article.title.toLowerCase().includes(keyword.toLowerCase());
    checks.push({
        id: 'keyword-title',
        label: 'Keyword di Judul',
        passed: keywordInTitle,
        score: keywordInTitle ? 20 : 0,
        maxScore: 20,
        message: keywordInTitle
            ? `Bagus! Keyword "${keyword}" ada di judul.`
            : `Tambahkan keyword "${keyword}" di judul artikel.`,
        severity: keywordInTitle ? 'good' : 'bad'
    });

    // 2. Keyword in Meta Description (15 points)
    const keywordInMeta = article.metaDescription.toLowerCase().includes(keyword.toLowerCase());
    checks.push({
        id: 'keyword-meta',
        label: 'Keyword di Meta Description',
        passed: keywordInMeta,
        score: keywordInMeta ? 15 : 0,
        maxScore: 15,
        message: keywordInMeta
            ? `Bagus! Keyword "${keyword}" ada di meta description.`
            : `Tambahkan keyword "${keyword}" di meta description.`,
        severity: keywordInMeta ? 'good' : 'bad'
    });

    // 3. Keyword in First 100 Words (15 points)
    const first100Words = plainContent.split(/\s+/).slice(0, 100).join(' ');
    const keywordInIntro = first100Words.toLowerCase().includes(keyword.toLowerCase());
    checks.push({
        id: 'keyword-intro',
        label: 'Keyword di Paragraf Pertama',
        passed: keywordInIntro,
        score: keywordInIntro ? 15 : 0,
        maxScore: 15,
        message: keywordInIntro
            ? `Bagus! Keyword "${keyword}" muncul di awal artikel.`
            : `Tambahkan keyword "${keyword}" di 100 kata pertama.`,
        severity: keywordInIntro ? 'good' : 'bad'
    });

    // 4. Keyword Density (15 points) - ideal 1-3%
    const density = calculateKeywordDensity(plainContent, keyword);
    const densityOk = density >= 0.5 && density <= 3;
    const densityGood = density >= 1 && density <= 2.5;
    checks.push({
        id: 'keyword-density',
        label: 'Kepadatan Keyword',
        passed: densityOk,
        score: densityGood ? 15 : densityOk ? 10 : 0,
        maxScore: 15,
        message: densityGood
            ? `Bagus! Kepadatan keyword ${density.toFixed(1)}% (ideal: 1-2.5%).`
            : densityOk
                ? `OK. Kepadatan keyword ${density.toFixed(1)}%. Idealnya 1-2.5%.`
                : density < 0.5
                    ? `Kepadatan keyword terlalu rendah (${density.toFixed(1)}%). Tambahkan keyword lebih banyak.`
                    : `Kepadatan keyword terlalu tinggi (${density.toFixed(1)}%). Kurangi pengulangan keyword.`,
        severity: densityGood ? 'good' : densityOk ? 'ok' : 'bad'
    });

    // 5. Heading Structure (10 points)
    const hasH2 = /<h2[^>]*>/i.test(article.contentHtml);
    const hasH3 = /<h3[^>]*>/i.test(article.contentHtml);
    const h2Count = (article.contentHtml.match(/<h2[^>]*>/gi) || []).length;
    const headingGood = hasH2 && h2Count >= 3;
    const headingOk = hasH2;
    checks.push({
        id: 'headings',
        label: 'Struktur Heading',
        passed: headingOk,
        score: headingGood ? 10 : headingOk ? 7 : 0,
        maxScore: 10,
        message: headingGood
            ? `Bagus! Artikel memiliki ${h2Count} heading H2${hasH3 ? ' dan H3' : ''}.`
            : headingOk
                ? `OK. Ada heading H2, tapi tambahkan lebih banyak subheading.`
                : `Tambahkan heading H2 untuk membagi artikel menjadi section.`,
        severity: headingGood ? 'good' : headingOk ? 'ok' : 'bad'
    });

    // 6. Meta Description Length (10 points) - ideal 120-160 chars
    const metaLength = article.metaDescription.length;
    const metaGood = metaLength >= 120 && metaLength <= 160;
    const metaOk = metaLength >= 50 && metaLength <= 170;
    checks.push({
        id: 'meta-length',
        label: 'Panjang Meta Description',
        passed: metaOk,
        score: metaGood ? 10 : metaOk ? 7 : 0,
        maxScore: 10,
        message: metaGood
            ? `Bagus! Meta description ${metaLength} karakter (ideal: 120-160).`
            : metaOk
                ? `OK. Meta description ${metaLength} karakter. Idealnya 120-160.`
                : metaLength < 50
                    ? `Meta description terlalu pendek (${metaLength}). Minimal 120 karakter.`
                    : `Meta description terlalu panjang (${metaLength}). Maksimal 160 karakter.`,
        severity: metaGood ? 'good' : metaOk ? 'ok' : 'bad'
    });

    // 7. Links (10 points)
    const linkCount = (article.contentHtml.match(/<a[^>]+href/gi) || []).length;
    const hasLinks = linkCount > 0;
    checks.push({
        id: 'links',
        label: 'Internal/External Links',
        passed: hasLinks,
        score: hasLinks ? 10 : 0,
        maxScore: 10,
        message: hasLinks
            ? `Bagus! Artikel memiliki ${linkCount} link.`
            : `Tambahkan minimal 1 link internal atau eksternal.`,
        severity: hasLinks ? 'good' : 'bad'
    });

    // 8. Image Alt Text (5 points)
    const hasImageAlt = Boolean(article.imageAlt && article.imageAlt.length > 0);
    const altHasKeyword = hasImageAlt && article.imageAlt!.toLowerCase().includes(keyword.toLowerCase());
    checks.push({
        id: 'image-alt',
        label: 'Alt Text Gambar',
        passed: hasImageAlt,
        score: altHasKeyword ? 5 : hasImageAlt ? 3 : 0,
        maxScore: 5,
        message: altHasKeyword
            ? `Bagus! Alt text mengandung keyword.`
            : hasImageAlt
                ? `OK. Ada alt text, tapi coba tambahkan keyword.`
                : `Tambahkan alt text untuk gambar featured.`,
        severity: altHasKeyword ? 'good' : hasImageAlt ? 'ok' : 'bad'
    });

    // Calculate totals
    const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
    const maxScore = checks.reduce((sum, c) => sum + c.maxScore, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);

    return {
        score: totalScore,
        maxScore,
        percentage,
        status: getStatus(percentage),
        checks
    };
}

// ==================== READABILITY ANALYSIS ====================

export function analyzeReadability(contentHtml: string): ReadabilityAnalysis {
    const checks: ReadabilityCheck[] = [];
    const plainContent = stripHtml(contentHtml);
    const sentences = getSentences(plainContent);
    const paragraphs = getParagraphs(contentHtml);
    const wordCount = countWords(plainContent);

    const sentenceCount = sentences.length;
    const paragraphCount = paragraphs.length;
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const avgWordsPerParagraph = paragraphCount > 0 ? wordCount / paragraphCount : 0;

    // 1. Sentence Length (25 points) - ideal < 20 words
    const sentenceGood = avgWordsPerSentence <= 15;
    const sentenceOk = avgWordsPerSentence <= 20;
    checks.push({
        id: 'sentence-length',
        label: 'Panjang Kalimat',
        passed: sentenceOk,
        score: sentenceGood ? 25 : sentenceOk ? 18 : 0,
        maxScore: 25,
        message: sentenceGood
            ? `Bagus! Rata-rata ${avgWordsPerSentence.toFixed(1)} kata/kalimat.`
            : sentenceOk
                ? `OK. Rata-rata ${avgWordsPerSentence.toFixed(1)} kata/kalimat. Coba lebih pendek.`
                : `Kalimat terlalu panjang (${avgWordsPerSentence.toFixed(1)} kata). Maksimal 20 kata.`,
        severity: sentenceGood ? 'good' : sentenceOk ? 'ok' : 'bad',
        value: avgWordsPerSentence
    });

    // 2. Paragraph Length (25 points) - ideal < 150 words
    const paragraphGood = avgWordsPerParagraph <= 100;
    const paragraphOk = avgWordsPerParagraph <= 150;
    checks.push({
        id: 'paragraph-length',
        label: 'Panjang Paragraf',
        passed: paragraphOk,
        score: paragraphGood ? 25 : paragraphOk ? 18 : 0,
        maxScore: 25,
        message: paragraphGood
            ? `Bagus! Rata-rata ${avgWordsPerParagraph.toFixed(0)} kata/paragraf.`
            : paragraphOk
                ? `OK. Rata-rata ${avgWordsPerParagraph.toFixed(0)} kata/paragraf. Coba pecah lebih pendek.`
                : `Paragraf terlalu panjang (${avgWordsPerParagraph.toFixed(0)} kata). Maksimal 150 kata.`,
        severity: paragraphGood ? 'good' : paragraphOk ? 'ok' : 'bad',
        value: avgWordsPerParagraph
    });

    // 3. Passive Voice (20 points) - ideal < 10%
    const passiveCount = countPassiveVoice(plainContent);
    const passivePercentage = sentenceCount > 0 ? (passiveCount / sentenceCount) * 100 : 0;
    const passiveGood = passivePercentage <= 5;
    const passiveOk = passivePercentage <= 10;
    checks.push({
        id: 'passive-voice',
        label: 'Kalimat Pasif',
        passed: passiveOk,
        score: passiveGood ? 20 : passiveOk ? 14 : 0,
        maxScore: 20,
        message: passiveGood
            ? `Bagus! Hanya ${passivePercentage.toFixed(0)}% kalimat pasif.`
            : passiveOk
                ? `OK. ${passivePercentage.toFixed(0)}% kalimat pasif. Coba kurangi.`
                : `Terlalu banyak kalimat pasif (${passivePercentage.toFixed(0)}%). Gunakan kalimat aktif.`,
        severity: passiveGood ? 'good' : passiveOk ? 'ok' : 'bad',
        value: passivePercentage
    });

    // 4. Transition Words (15 points) - ideal > 30%
    const { total: totalParagraphs, withTransition } = countTransitionParagraphs(contentHtml);
    const transitionPercentage = totalParagraphs > 0 ? (withTransition / totalParagraphs) * 100 : 0;
    const transitionGood = transitionPercentage >= 30;
    const transitionOk = transitionPercentage >= 20;
    checks.push({
        id: 'transition-words',
        label: 'Kata Transisi',
        passed: transitionOk,
        score: transitionGood ? 15 : transitionOk ? 10 : 0,
        maxScore: 15,
        message: transitionGood
            ? `Bagus! ${transitionPercentage.toFixed(0)}% paragraf menggunakan kata transisi.`
            : transitionOk
                ? `OK. ${transitionPercentage.toFixed(0)}% paragraf pakai transisi. Tambahkan lagi.`
                : `Kurang kata transisi (${transitionPercentage.toFixed(0)}%). Tambahkan: namun, selain itu, jadi, dll.`,
        severity: transitionGood ? 'good' : transitionOk ? 'ok' : 'bad',
        value: transitionPercentage
    });

    // 5. Content Length (15 points) - ideal 800-1500 words
    const lengthGood = wordCount >= 800 && wordCount <= 1500;
    const lengthOk = wordCount >= 500 && wordCount <= 2000;
    checks.push({
        id: 'content-length',
        label: 'Panjang Konten',
        passed: lengthOk,
        score: lengthGood ? 15 : lengthOk ? 10 : 0,
        maxScore: 15,
        message: lengthGood
            ? `Bagus! Artikel memiliki ${wordCount} kata (ideal: 800-1500).`
            : lengthOk
                ? `OK. Artikel ${wordCount} kata. Idealnya 800-1500 kata.`
                : wordCount < 500
                    ? `Artikel terlalu pendek (${wordCount} kata). Minimal 800 kata.`
                    : `Artikel terlalu panjang (${wordCount} kata). Maksimal 1500 kata.`,
        severity: lengthGood ? 'good' : lengthOk ? 'ok' : 'bad',
        value: wordCount
    });

    // Calculate totals
    const totalScore = checks.reduce((sum, c) => sum + c.score, 0);
    const maxScore = checks.reduce((sum, c) => sum + c.maxScore, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);

    return {
        score: totalScore,
        maxScore,
        percentage,
        status: getStatus(percentage),
        checks,
        stats: {
            wordCount,
            sentenceCount,
            paragraphCount,
            avgWordsPerSentence,
            avgWordsPerParagraph
        }
    };
}

// ==================== COMBINED ANALYSIS ====================

export interface FullAnalysis {
    seo: SEOAnalysis;
    readability: ReadabilityAnalysis;
    overallScore: number;
    overallStatus: 'good' | 'ok' | 'bad';
}

export function analyzeArticle(
    article: {
        title: string;
        metaDescription: string;
        contentHtml: string;
        imageAlt?: string;
    },
    keyword: string
): FullAnalysis {
    const seo = analyzeSEO(article, keyword);
    const readability = analyzeReadability(article.contentHtml);

    // Overall = average of SEO and Readability
    const overallScore = Math.round((seo.percentage + readability.percentage) / 2);

    return {
        seo,
        readability,
        overallScore,
        overallStatus: getStatus(overallScore)
    };
}
