// SEO and Readability Scoring Utility

interface ScoreResult {
    seoScore: number;
    readabilityScore: number;
    seoDetails: string[];
    readabilityDetails: string[];
}

export function calculateArticleScores(article: {
    title: string;
    metaDescription?: string;
    contentHtml: string;
    mainKeyword?: string;
}): ScoreResult {
    const seoDetails: string[] = [];
    const readabilityDetails: string[] = [];
    let seoScore = 0;
    let readabilityScore = 0;

    // Guard against undefined content
    const htmlContent = article.contentHtml || '';

    // Strip HTML for text analysis
    const textContent = htmlContent
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = htmlContent.split(/<\/p>/gi).filter(p => p.trim().length > 0);

    // === SEO SCORING (out of 100) ===

    // 1. Title contains keyword (20 points)
    if (article.mainKeyword && article.title.toLowerCase().includes(article.mainKeyword.toLowerCase())) {
        seoScore += 20;
        seoDetails.push('✓ Keyword in title');
    } else if (article.mainKeyword) {
        seoDetails.push('✗ Keyword not in title');
    }

    // 2. Meta description exists and has good length (20 points)
    const metaLen = article.metaDescription?.length || 0;
    if (metaLen >= 120 && metaLen <= 160) {
        seoScore += 20;
        seoDetails.push('✓ Meta description optimal (120-160 chars)');
    } else if (metaLen >= 80 && metaLen < 120) {
        seoScore += 10;
        seoDetails.push('~ Meta description short');
    } else if (metaLen > 160) {
        seoScore += 10;
        seoDetails.push('~ Meta description too long');
    } else {
        seoDetails.push('✗ Meta description missing or too short');
    }

    // 3. Content length (20 points)
    if (wordCount >= 800) {
        seoScore += 20;
        seoDetails.push(`✓ Good length (${wordCount} words)`);
    } else if (wordCount >= 500) {
        seoScore += 10;
        seoDetails.push(`~ Moderate length (${wordCount} words)`);
    } else {
        seoDetails.push(`✗ Too short (${wordCount} words)`);
    }

    // 4. Has headings (H2/H3) (20 points)
    const h2Count = (htmlContent.match(/<h2/gi) || []).length;
    const h3Count = (htmlContent.match(/<h3/gi) || []).length;
    if (h2Count >= 2 && h3Count >= 1) {
        seoScore += 20;
        seoDetails.push(`✓ Good heading structure (${h2Count} H2, ${h3Count} H3)`);
    } else if (h2Count >= 1) {
        seoScore += 10;
        seoDetails.push(`~ Limited headings (${h2Count} H2)`);
    } else {
        seoDetails.push('✗ No headings found');
    }

    // 5. Keyword in first 100 words (20 points)
    if (article.mainKeyword) {
        const first100 = textContent.split(/\s+/).slice(0, 100).join(' ').toLowerCase();
        if (first100.includes(article.mainKeyword.toLowerCase())) {
            seoScore += 20;
            seoDetails.push('✓ Keyword in intro paragraph');
        } else {
            seoDetails.push('✗ Keyword not in intro');
        }
    }

    // === READABILITY SCORING (out of 100) ===

    // 1. Sentence length (25 points) - avg under 20 words is good
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
    if (avgSentenceLength <= 15) {
        readabilityScore += 25;
        readabilityDetails.push('✓ Short sentences (easy to read)');
    } else if (avgSentenceLength <= 20) {
        readabilityScore += 15;
        readabilityDetails.push('~ Moderate sentence length');
    } else {
        readabilityScore += 5;
        readabilityDetails.push('✗ Long sentences (hard to read)');
    }

    // 2. Paragraph length (25 points) - short paragraphs are good
    const avgParagraphLength = paragraphs.length > 0 ? wordCount / paragraphs.length : 0;
    if (avgParagraphLength <= 60) {
        readabilityScore += 25;
        readabilityDetails.push('✓ Short paragraphs');
    } else if (avgParagraphLength <= 100) {
        readabilityScore += 15;
        readabilityDetails.push('~ Moderate paragraph length');
    } else {
        readabilityScore += 5;
        readabilityDetails.push('✗ Long paragraphs');
    }

    // 3. Use of bullet points/lists (25 points)
    const listCount = (htmlContent.match(/<li/gi) || []).length;
    if (listCount >= 5) {
        readabilityScore += 25;
        readabilityDetails.push(`✓ Good use of lists (${listCount} items)`);
    } else if (listCount >= 2) {
        readabilityScore += 15;
        readabilityDetails.push(`~ Some lists (${listCount} items)`);
    } else {
        readabilityScore += 5;
        readabilityDetails.push('✗ No bullet points');
    }

    // 4. Use of bold/emphasis for scanning (25 points)
    const boldCount = (htmlContent.match(/<(strong|b)>/gi) || []).length;
    if (boldCount >= 5) {
        readabilityScore += 25;
        readabilityDetails.push(`✓ Good emphasis (${boldCount}x bold)`);
    } else if (boldCount >= 2) {
        readabilityScore += 15;
        readabilityDetails.push(`~ Some emphasis (${boldCount}x bold)`);
    } else {
        readabilityScore += 5;
        readabilityDetails.push('✗ No bold text for scanning');
    }

    return {
        seoScore: Math.min(100, Math.max(0, seoScore)),
        readabilityScore: Math.min(100, Math.max(0, readabilityScore)),
        seoDetails,
        readabilityDetails
    };
}

export function getScoreColor(score: number): 'green' | 'yellow' | 'red' {
    if (score >= 70) return 'green';
    if (score >= 40) return 'yellow';
    return 'red';
}

export function getScoreColorClass(score: number): string {
    const color = getScoreColor(score);
    switch (color) {
        case 'green': return 'bg-green-100 text-green-700';
        case 'yellow': return 'bg-yellow-100 text-yellow-700';
        case 'red': return 'bg-red-100 text-red-700';
    }
}
