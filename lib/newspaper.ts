
import type { HeistReportData } from '../types';
import { t } from './i18n';

// Helper to get a random element from an array
const pickArray = (key: string): string => {
    const arr = t(key) as unknown as string[];
    if (!Array.isArray(arr)) {
        console.warn(`Translation key is not an array: ${key}`);
        return key;
    }
    return arr[Math.floor(Math.random() * arr.length)];
};

const pickQuote = (source: any[], tags: Set<string>, usedQuotes: Set<string>): string | null => {
    const relevantQuotes = source.filter((q: any) => q.tags.some((tag: string) => tags.has(tag)) && !usedQuotes.has(q.text));
    if (relevantQuotes.length === 0) return null;
    const quote = relevantQuotes[Math.floor(Math.random() * relevantQuotes.length)];
    return quote.text;
};

export function generateNewspaperReport(data: HeistReportData): { headline: string; article: string } {
    const tags = new Set<string>();

    // --- Determine Tags ---
    const isExplosives = data.explosivesDetonated;
    const isSmashed = data.doorSmashed;
    const isAlarmOnly = data.alarmTriggered && !isExplosives && !isSmashed;
    const isDestructive = isExplosives || isSmashed;

    const isBigHaul = data.cashGained > 50000;

    if (data.wasSuccess) {
        tags.add('success');
        if (isExplosives) tags.add('explosives');
        if (isSmashed) tags.add('smashed_door');
        if (isDestructive) tags.add('destructive');
        if (isAlarmOnly) tags.add('alarm_only');
        if (!isDestructive && !data.alarmTriggered) tags.add('clean');
        if (data.cashGained > 0) {
            tags.add(isBigHaul ? 'big_haul' : 'small_haul');
        } else {
            tags.add('no_haul');
        }
    } else {
        tags.add('failure');
    }

    if (data.alarmTriggered) tags.add('alarm');
    if (data.capturedPlayers.length > 0) {
        tags.add('captured');
    } else {
        tags.add('escaped');
    }

    // --- Build Article ---
    let headline = "";
    const articleParts: string[] = [];
    const usedQuotes = new Set<string>();

    // 1. Select Headline
    if (data.wasSuccess) {
        if (data.cashGained === 0) {
            headline = pickArray('newspaper.headlines.success_empty');
        } else if (isExplosives) {
            headline = pickArray('newspaper.headlines.success_explosive');
        } else if (isSmashed) {
            headline = pickArray('newspaper.headlines.success_destructive');
        } else if (data.alarmTriggered) {
            headline = pickArray('newspaper.headlines.success_loud');
        } else {
            headline = pickArray('newspaper.headlines.success_clean');
        }
    } else {
        headline = tags.has('captured') ? pickArray('newspaper.headlines.failure_captured') : pickArray('newspaper.headlines.failure_escaped_empty');
    }

    // 2. Select Introduction
    let introKey = 'newspaper.introductions.clean';
    if (tags.has('explosives')) introKey = 'newspaper.introductions.explosive';
    else if (tags.has('destructive')) introKey = 'newspaper.introductions.destructive';
    else if (tags.has('alarm')) introKey = 'newspaper.introductions.loud';
    else if (tags.has('failure')) introKey = 'newspaper.introductions.failure';

    articleParts.push(pickArray(introKey));

    // 3. Select Core Details
    const detailPool: string[] = [];
    if (tags.has('clean')) detailPool.push(...(t('newspaper.details.clean_job') as unknown as string[]));
    if (tags.has('smashed_door')) detailPool.push(...(t('newspaper.details.smashed_door') as unknown as string[]));
    if (tags.has('destructive')) detailPool.push(...(t('newspaper.details.destructive_generic') as unknown as string[]));
    if (tags.has('alarm')) detailPool.push(...(t('newspaper.details.alarm_triggered') as unknown as string[]));
    if (tags.has('explosives')) detailPool.push(...(t('newspaper.details.explosives_used') as unknown as string[]));
    if (tags.has('big_haul')) detailPool.push(...(t('newspaper.details.big_haul') as unknown as string[]));
    if (tags.has('small_haul')) detailPool.push(...(t('newspaper.details.small_haul') as unknown as string[]));
    if (tags.has('no_haul')) detailPool.push(...(t('newspaper.details.no_haul') as unknown as string[]));
    if (tags.has('captured')) detailPool.push(...(t('newspaper.details.captured') as unknown as string[]));
    if (tags.has('escaped')) detailPool.push(...(t('newspaper.details.escaped') as unknown as string[]));

    // Add 1-2 unique details
    if (detailPool.length > 0) {
        const d1 = detailPool[Math.floor(Math.random() * detailPool.length)];
        articleParts.push(d1);
        if (detailPool.length > 1) {
            let d2 = detailPool[Math.floor(Math.random() * detailPool.length)];
            let attempts = 0;
            while (d2 === d1 && attempts < 10) {
                d2 = detailPool[Math.floor(Math.random() * detailPool.length)];
                attempts++;
            }
            if (d2 !== d1) articleParts.push(d2);
        }
    }

    // 4. Select Quotes
    const policeQuotes = t('newspaper.quotes.police') as any;
    const witnessQuotes = t('newspaper.quotes.witness') as any;
    const ownerQuotes = t('newspaper.quotes.owner') as any;
    const underworldQuotes = t('newspaper.quotes.underworld') as any;

    const q1 = pickQuote(policeQuotes, tags, usedQuotes);
    if (q1) { articleParts.push(q1); usedQuotes.add(q1); }

    const otherSource = Math.random() > 0.5 ? witnessQuotes : ownerQuotes;
    const q2 = pickQuote(otherSource, tags, usedQuotes);
    if (q2) { articleParts.push(q2); usedQuotes.add(q2); }

    if (Math.random() > 0.5) {
        const q3 = pickQuote(underworldQuotes, tags, usedQuotes);
        if (q3) { articleParts.push(q3); usedQuotes.add(q3); }
    }

    // Shuffle body parts for variety
    const body = articleParts.slice(1).sort(() => Math.random() - 0.5);
    const article = [articleParts[0], ...body].join(' ');

    return { headline, article };
}
