import { TaskParser } from '../../src/parser/task-parser';
import { TodoTrackerSettings } from '../../src/settings/defaults';

describe('US-1.1: Strict Header Detection', () => {
    let parser: TaskParser;
    let settings: TodoTrackerSettings;

    beforeEach(() => {
        settings = {
            todoKeywords: ['TODO'],
            doingKeywords: ['DOING'],
            doneKeywords: ['DONE'],
            scheduledKeywords: ['SCHEDULED'],
            deadlineKeywords: ['DEADLINE'],
            priorityKeywords: [], // Deprecated
            keywordColors: {},
            keywordDescriptions: {},
            includeCalloutBlocks: true,
            includeCodeBlocks: true,
            priorityQueues: [['#A', '#B', '#C']],
            workflows: [['TODO', 'DOING', 'DONE']],
            sortMethod: 'default',
            taskViewMode: 'default',
            collapsedPaths: [],
            languageCommentSupport: { enabled: false },
        };
        parser = TaskParser.create(settings);
    });

    describe('Valid detections (should parse)', () => {
        it('detects TODO at absolute start of line', () => {
            const content = 'TODO Tarea principal';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].state).toBe('TODO');
            expect(tasks[0].text).toBe('Tarea principal');
            expect(tasks[0].indent).toBe('');
        });

        it('detects TODO with leading spaces (indentation)', () => {
            const content = '  DOING Subtarea indentada';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].state).toBe('DOING');
            expect(tasks[0].text).toBe('Subtarea indentada');
            expect(tasks[0].indent).toBe('  ');
        });

        it('detects multiple keywords at different indentation levels', () => {
            const content = `TODO Tarea padre
  DOING Subtarea 1
    DONE Subtarea 2
TODO Otra tarea`;
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(4);
            expect(tasks[0].state).toBe('TODO');
            expect(tasks[0].indent).toBe('');
            expect(tasks[1].state).toBe('DOING');
            expect(tasks[1].indent).toBe('  ');
            expect(tasks[2].state).toBe('DONE');
            expect(tasks[2].indent).toBe('    ');
            expect(tasks[3].state).toBe('TODO');
            expect(tasks[3].indent).toBe('');
        });

        it('handles tab indentation', () => {
            const content = '\tTODO Tarea con tab';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].state).toBe('TODO');
            expect(tasks[0].text).toBe('Tarea con tab');
        });
    });

    describe('Invalid detections (should NOT parse)', () => {
        it('does NOT detect TODO after bullet list marker', () => {
            const content = '- TODO Tarea en lista';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(0);
        });

        it('does NOT detect TODO after numbered list marker', () => {
            const content = '1. TODO Tarea numerada';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(0);
        });

        it('does NOT detect TODO after checkbox', () => {
            const content = '- [ ] TODO Tarea checkbox';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(0);
        });

        it('does NOT detect TODO in blockquote', () => {
            const content = '> TODO Tarea citada';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(0);
        });

        it('does NOT detect TODO in callout', () => {
            const content = '> [!info] TODO Tarea en callout';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(0);
        });

        it('does NOT detect TODO in middle of sentence', () => {
            const content = 'Revisar el TODO de ayer';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(0);
        });

        it('does NOT detect TODO at end of list item', () => {
            const content = '- Completar el TODO pendiente';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(0);
        });
    });

    describe('Edge cases', () => {
        it('requires space after keyword', () => {
            const content = 'TODOSinEspacio';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(0);
        });

        it('handles multiple spaces after keyword', () => {
            const content = 'TODO    Muchos espacios';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].text).toBe('Muchos espacios');
        });

        it('handles empty lines correctly', () => {
            const content = `TODO Tarea 1

TODO Tarea 2`;
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(2);
        });

        it('listMarker is always empty in strict mode', () => {
            const content = 'TODO Test listMarker';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].listMarker).toBe('');
        });

        it('tail is always empty in strict mode', () => {
            const content = 'TODO Test tail';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].tail).toBe('');
        });
    });

    describe('With priorities and dates', () => {
        it('detects task with priority at start of line', () => {
            const content = 'TODO Task with priority #A';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].state).toBe('TODO');
            expect(tasks[0].priority).toBe('#A');
            expect(tasks[0].text).not.toContain('#A'); // Should be removed from text
        });

        it('detects task with scheduled date', () => {
            // The keyword 'SCHEDULED' is configured in beforeEach
            const content = 'TODO Task with date\nSCHEDULED: 2026-02-15';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].state).toBe('TODO');
            // Note: If this fails, verify scheduledKeywords includes 'SCHEDULED'
            if (tasks[0].scheduledDate === null) {
                console.log('scheduledKeywords:', settings.scheduledKeywords);
                console.log('Task:', tasks[0]);
            }
            expect(tasks[0].scheduledDate).not.toBeNull();
        });

        it('detects task with both dates', () => {
            // IMPORTANT: Date keywords need exact indent match with task
            const content = 'TODO Important task\nSCHEDULED: 2026-02-15\nDEADLINE: 2026-02-20';
            const tasks = parser.parseFile(content, 'test.md');

            expect(tasks).toHaveLength(1);
            expect(tasks[0].scheduledDate).not.toBeNull();
            expect(tasks[0].deadlineDate).not.toBeNull();
        });
    });
});
