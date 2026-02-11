import {
    buildDefinedLabelMap,
    dedupeLabelsCaseInsensitive,
    mergeLabelsWithDefinedOrder,
    normalizeLabelKey,
    toValidLabelDisplay,
} from '../src/labels/label-utils';

describe('label utils', () => {
    test('normalizes label keys case-insensitively', () => {
        expect(normalizeLabelKey('@Backend')).toBe('backend');
        expect(normalizeLabelKey('BACKEND')).toBe('backend');
    });

    test('validates label display tokens', () => {
        expect(toValidLabelDisplay('@Team_A')).toBe('Team_A');
        expect(toValidLabelDisplay('123no')).toBeNull();
    });

    test('deduplicates labels preserving first display name', () => {
        const deduped = dedupeLabelsCaseInsensitive(['Backend', 'backend', 'API']);
        expect(deduped).toEqual(['Backend', 'API']);
    });

    test('merges dynamic labels after ordered defined labels', () => {
        const merged = mergeLabelsWithDefinedOrder(
            ['Backend', 'Urgent'],
            ['api', 'backend', 'TeamA'],
        );
        expect(merged).toEqual(['Backend', 'Urgent', 'api', 'TeamA']);

        const map = buildDefinedLabelMap(['Backend', 'Urgent']);
        expect(map.get('backend')).toBe('Backend');
    });
});
