import { TaskParser } from '../../src/parser/task-parser';
import { TodoTrackerSettings } from '../../src/settings/defaults';

describe('Épica 5: Labels System', () => {
    let parser: TaskParser;
    let settings: TodoTrackerSettings;

    beforeEach(() => {
        settings = {
            todoKeywords: ['TODO'],
            doingKeywords: ['DOING'],
            doneKeywords: ['DONE'],
            scheduledKeywords: ['SCHEDULED'],
            deadlineKeywords: ['DEADLINE'],
            priorityQueues: [['P1', 'P2', 'P3']],
            priorityKeywords: [],
            workflows: [['TODO', 'DOING', 'DONE']],
            keywordColors: {},
            keywordDescriptions: {},
            includeCodeBlocks: false,
            includeCalloutBlocks: true,
            languageCommentSupport: { enabled: false },
            taskViewMode: 'default',
            sortMethod: 'default',
            groupingMethod: 'none',
            advancedFilters: { states: [], priorities: [], labels: [], dateMode: 'all' },
            collapsedPaths: [],
            dateFormat: 'DD/MM/YYYY',
            labelMode: 'free',
            definedLabels: [],
            labelColors: {}
        } as TodoTrackerSettings;
        parser = TaskParser.create(settings);
    });

    describe('US-5.1: Label Parsing', () => {
        test('should parse single label from task text', () => {
            const content = 'TODO Implement feature @Work';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].labels).toEqual(['Work']);
            expect(tasks[0].text).toBe('Implement feature');
        });

        test('should parse multiple labels from task text', () => {
            const content = 'TODO Urgent task @Work @Urgent @TeamA';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].labels).toEqual(['Work', 'Urgent', 'TeamA']);
            expect(tasks[0].text).toBe('Urgent task');
        });

        test('should parse labels with priority', () => {
            const content = 'TODO P1 Critical bug @Backend @Urgent';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].priority).toBe('P1');
            expect(tasks[0].labels).toEqual(['Backend', 'Urgent']);
            expect(tasks[0].text).toBe('Critical bug');
        });

        test('should handle labels with underscores and dashes', () => {
            const content = 'TODO Task @My_Project @team-alpha';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].labels).toEqual(['My_Project', 'team-alpha']);
        });

        test('should not parse email-like patterns as labels', () => {
            const content = 'TODO Contact user@example.com about issue';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].labels).toEqual([]);
            expect(tasks[0].text).toContain('user@example.com');
        });

        test('should not parse labels starting with numbers', () => {
            const content = 'TODO Task @123invalid';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].labels).toEqual([]);
        });

        test('should handle task with no labels', () => {
            const content = 'TODO Simple task without labels';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].labels).toEqual([]);
            expect(tasks[0].text).toBe('Simple task without labels');
        });

        test('should handle labels at the beginning of text', () => {
            const content = 'TODO @Important This is very important';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].labels).toEqual(['Important']);
            expect(tasks[0].text).toBe('This is very important');
        });

        test('should handle labels in the middle of text', () => {
            const content = 'TODO Review the @code and submit @PR';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].labels).toEqual(['code', 'PR']);
            expect(tasks[0].text).toBe('Review the and submit');
        });
    });
});
