import { TaskParser } from '../../src/parser/task-parser';
import { TodoTrackerSettings } from '../../src/settings/defaults';

describe('PLAN keyword test', () => {
    let parser: TaskParser;

    beforeEach(() => {
        const settings: TodoTrackerSettings = {
            todoKeywords: ['TODO'],
            doingKeywords: ['DOING'],
            doneKeywords: ['DONE'],
            scheduledKeywords: ['PLAN'],
            deadlineKeywords: ['DUE'],
            priorityKeywords: [],
            keywordColors: {},
            keywordDescriptions: {},
            includeCalloutBlocks: true,
            includeCodeBlocks: true,
            priorityQueues: [['#A']],
            workflows: [['TODO', 'DOING', 'DONE']],
            sortMethod: 'default',
            taskViewMode: 'default',
            collapsedPaths: [],
            languageCommentSupport: { enabled: false },
        };
        parser = TaskParser.create(settings);
    });

    it('PLAN should NOT be detected as a task', () => {
        const content = 'PLAN: 2026-02-15';
        const tasks = parser.parseFile(content, 'test.md');

        expect(tasks).toHaveLength(0);
    });

    it('PLAN after TODO should be parsed as date', () => {
        const content = `TODO Test
PLAN: 2026-02-15`;
        const tasks = parser.parseFile(content, 'test.md');

        expect(tasks).toHaveLength(1);
        expect(tasks[0].scheduledDate).not.toBeNull();
    });

    it('legacy alias SCHEDULED still works for compatibility', () => {
        const content = `TODO Legacy Test
SCHEDULED: 2026-02-15`;
        const tasks = parser.parseFile(content, 'test.md');

        expect(tasks).toHaveLength(1);
        expect(tasks[0].scheduledDate).not.toBeNull();
    });
});
