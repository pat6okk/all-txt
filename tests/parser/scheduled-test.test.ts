import { TaskParser } from '../../src/parser/task-parser';
import { TodoTrackerSettings } from '../../src/settings/defaults';

describe('SCHEDULED keyword test', () => {
    let parser: TaskParser;

    beforeEach(() => {
        const settings: TodoTrackerSettings = {
            todoKeywords: ['TODO'],
            doingKeywords: ['DOING'],
            doneKeywords: ['DONE'],
            scheduledKeywords: ['SCHEDULED'],
            deadlineKeywords: ['DEADLINE'],
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

    it('SCHEDULED should NOT be detected as a task', () => {
        const content = 'SCHEDULED: 2026-02-15';
        const tasks = parser.parseFile(content, 'test.md');

        expect(tasks).toHaveLength(0);
    });

    it('SCHEDULED after TODO should be parsed as date', () => {
        const content = `TODO Test
SCHEDULED: 2026-02-15`;
        const tasks = parser.parseFile(content, 'test.md');

        console.log('Parsed tasks:', JSON.stringify(tasks, null, 2));

        expect(tasks).toHaveLength(1);
        expect(tasks[0].scheduledDate).not.toBeNull();
    });
});
