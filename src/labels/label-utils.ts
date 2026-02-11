const LABEL_TOKEN_REGEX = /^[A-Za-z][A-Za-z0-9_-]*$/;
const TASK_LABEL_REGEX = /(?:^|\s)@([A-Za-z][A-Za-z0-9_-]*)(?=\s|$|[.,;:!?])/g;
const INLINE_LABEL_REGEX = /@([A-Za-z][A-Za-z0-9_-]*)/g;

export interface LabelMatch {
    label: string;
    fullMatch: string;
    index: number;
}

export function stripLabelPrefix(value: string): string {
    const trimmed = value.trim();
    return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
}

export function normalizeLabelKey(value: string): string {
    return stripLabelPrefix(value).toLowerCase();
}

export function toValidLabelDisplay(value: string): string | null {
    const candidate = stripLabelPrefix(value);
    if (!LABEL_TOKEN_REGEX.test(candidate)) {
        return null;
    }
    return candidate;
}

export function dedupeLabelsCaseInsensitive(labels: string[]): string[] {
    const deduped: string[] = [];
    const seen = new Set<string>();

    for (const label of labels) {
        const valid = toValidLabelDisplay(label);
        if (!valid) {
            continue;
        }

        const key = normalizeLabelKey(valid);
        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        deduped.push(valid);
    }

    return deduped;
}

export function buildDefinedLabelMap(labels: string[]): Map<string, string> {
    const byKey = new Map<string, string>();
    for (const label of dedupeLabelsCaseInsensitive(labels)) {
        byKey.set(normalizeLabelKey(label), label);
    }
    return byKey;
}

export function getCanonicalLabelDisplay(
    value: string,
    definedLabelsByKey: Map<string, string>,
): string | null {
    const valid = toValidLabelDisplay(value);
    if (!valid) {
        return null;
    }
    return definedLabelsByKey.get(normalizeLabelKey(valid)) ?? valid;
}

export function collectTaskLabelMatches(text: string): LabelMatch[] {
    const matches: LabelMatch[] = [];
    const regex = new RegExp(TASK_LABEL_REGEX.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        matches.push({
            label: match[1],
            fullMatch: match[0],
            index: match.index,
        });
    }

    return matches;
}

export function collectInlineLabels(text: string): string[] {
    const labels: string[] = [];
    const regex = new RegExp(INLINE_LABEL_REGEX.source, 'g');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        labels.push(match[1]);
    }

    return dedupeLabelsCaseInsensitive(labels);
}

export function mergeLabelsWithDefinedOrder(
    definedLabels: string[],
    dynamicLabels: string[],
): string[] {
    const ordered = dedupeLabelsCaseInsensitive(definedLabels);
    const seen = new Set<string>(ordered.map(label => normalizeLabelKey(label)));

    const extras = dedupeLabelsCaseInsensitive(dynamicLabels)
        .filter(label => !seen.has(normalizeLabelKey(label)))
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    return [...ordered, ...extras];
}

export function escapeRegexLiteral(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
