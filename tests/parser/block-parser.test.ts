import { TaskParser } from '../../src/parser/task-parser';
import { TodoTrackerSettings } from '../../src/settings/defaults';

describe('US-1.2: Block Parsing Logic', () => {
    let parser: TaskParser;
    let settings: TodoTrackerSettings;

    beforeEach(() => {
        settings = {
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
            priorityQueues: [['#A', '#B', '#C']],
            workflows: [['TODO', 'DOING', 'DONE']],
            sortMethod: 'default',
            taskViewMode: 'default',
            collapsedPaths: [],
            languageCommentSupport: { enabled: false },
        };
        parser = TaskParser.create(settings);
    });

    it('should capture content until the --- delimiter', () => {
        const content = `TODO Main Task
Some notes
More notes
---
Not part of task`;
        const tasks = parser.parseFile(content, 'test.md');

        expect(tasks).toHaveLength(1);
        expect(tasks[0].state).toBe('TODO');
        expect(tasks[0].blockContent).toContain('Some notes');
        expect(tasks[0].blockContent).toContain('More notes');
        expect(tasks[0].blockContent).not.toContain('Not part of task');
        expect(tasks[0].blockEndLine).toBe(3); // Line with ---
    });

    it('should capture subtasks within the block', () => {
        const content = `TODO Shopping List
- [ ] Milk
- [x] Bread
---`;
        const tasks = parser.parseFile(content, 'test.md');

        expect(tasks).toHaveLength(1);
        expect(tasks[0].subtasks).toHaveLength(2);
        expect(tasks[0].subtasks?.[0].text).toBe('Milk');
        expect(tasks[0].subtasks?.[0].completed).toBe(false);
        expect(tasks[0].subtasks?.[1].text).toBe('Bread');
        expect(tasks[0].subtasks?.[1].completed).toBe(true);
    });

    it('should terminate block on next header at same indentation', () => {
        const content = `TODO First Task
Notes for first
TODO Second Task
Notes for second`;
        const tasks = parser.parseFile(content, 'test.md');

        expect(tasks).toHaveLength(2);
        expect(tasks[0].text).toBe('First Task');
        expect(tasks[0].blockContent).toEqual(['Notes for first']);
        expect(tasks[1].text).toBe('Second Task');
        expect(tasks[1].blockContent).toEqual(['Notes for second']);
    });

    it('should support nested tasks (child is part of parent block)', () => {
        const content = `TODO Parent
  DOING Child
  ---
---`;
        const tasks = parser.parseFile(content, 'test.md');

        expect(tasks).toHaveLength(2);
        expect(tasks[0].text).toBe('Parent');
        // The child task line IS part of the parent's block content
        expect(tasks[0].blockContent).toContain('  DOING Child');
        expect(tasks[1].text).toBe('Child');
        expect(tasks[1].indent).toBe('  ');
    });

    it('should terminate block on next header at LESSER indentation', () => {
        const content = `  TODO Indented Task
  Notes
TODO Top Level Task`;
        const tasks = parser.parseFile(content, 'test.md');

        expect(tasks).toHaveLength(2);
        expect(tasks[0].text).toBe('Indented Task');
        expect(tasks[0].blockContent).toEqual(['  Notes']);
        expect(tasks[1].text).toBe('Top Level Task');
    });

    it('should handle EOF correctly as block terminator', () => {
        const content = `TODO End of File task
No delimiter here`;
        const tasks = parser.parseFile(content, 'test.md');

        expect(tasks).toHaveLength(1);
        expect(tasks[0].blockContent).toEqual(['No delimiter here']);
    });
});
