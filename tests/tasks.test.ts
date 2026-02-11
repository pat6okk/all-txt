import { TaskParser } from '../src/parser/task-parser';
import { DEFAULT_SETTINGS, TodoTrackerSettings } from '../src/settings/defaults';

function createSettings(overrides: Partial<TodoTrackerSettings> = {}): TodoTrackerSettings {
  return {
    ...DEFAULT_SETTINGS,
    todoKeywords: ['TODO', 'LATER', 'WAIT'],
    doingKeywords: ['DOING', 'NOW'],
    doneKeywords: ['DONE', 'CANCELLED'],
    scheduledKeywords: ['PLAN'],
    deadlineKeywords: ['DUE'],
    priorityQueues: [['#A', '#B', '#C']],
    priorityKeywords: [],
    includeCalloutBlocks: true,
    includeCodeBlocks: false,
    languageCommentSupport: { enabled: false },
    ...overrides,
  };
}

describe('Task parser strict contract', () => {
  test('parses a task when keyword starts the line', () => {
    const parser = TaskParser.create(createSettings());
    const tasks = parser.parseFile('TODO write docs', 'test.md');

    expect(tasks).toHaveLength(1);
    expect(tasks[0].state).toBe('TODO');
    expect(tasks[0].text).toBe('write docs');
    expect(tasks[0].listMarker).toBe('');
    expect(tasks[0].tail).toBe('');
  });

  test('parses a task with indentation', () => {
    const parser = TaskParser.create(createSettings());
    const tasks = parser.parseFile('    DOING indented task', 'test.md');

    expect(tasks).toHaveLength(1);
    expect(tasks[0].state).toBe('DOING');
    expect(tasks[0].indent).toBe('    ');
  });

  test('rejects legacy prefixes and checkbox syntax', () => {
    const parser = TaskParser.create(createSettings());
    const content = [
      '- TODO bullet syntax',
      '1. TODO numbered syntax',
      'a) TODO letter syntax',
      '- [ ] TODO checkbox syntax',
      '- [x] DONE checkbox syntax',
      '> TODO quoted syntax',
      '>[!info] TODO callout syntax',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(0);
  });

  test('extracts priority and labels from strict syntax', () => {
    const parser = TaskParser.create(createSettings());
    const tasks = parser.parseFile('TODO #A prepare proposal @Work @Urgent', 'test.md');

    expect(tasks).toHaveLength(1);
    expect(tasks[0].priority).toBe('#A');
    expect(tasks[0].labels).toEqual(['Work', 'Urgent']);
    expect(tasks[0].text).toBe('prepare proposal');
  });

  test('extracts scheduled and deadline metadata', () => {
    const parser = TaskParser.create(createSettings());
    const content = [
      'TODO release candidate',
      'PLAN: <2026-02-10>',
      'DUE: <2026-02-11>',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].scheduledDate).not.toBeNull();
    expect(tasks[0].deadlineDate).not.toBeNull();
  });

  test('uses first scheduled metadata occurrence only', () => {
    const parser = TaskParser.create(createSettings());
    const content = [
      'TODO duplicate dates',
      'PLAN: <2026-02-10>',
      'PLAN: <2026-02-12>',
      'DUE: <2026-02-20>',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].scheduledDate?.getDate()).toBe(10);
    expect(tasks[0].deadlineDate?.getDate()).toBe(20);
  });

  test('parses multiple strict tasks and skips non-task lines', () => {
    const parser = TaskParser.create(createSettings());
    const content = [
      'TODO first',
      'This line is not a task',
      'DOING second',
      '',
      'DONE third',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(3);
    expect(tasks[0].state).toBe('TODO');
    expect(tasks[1].state).toBe('DOING');
    expect(tasks[2].state).toBe('DONE');
    expect(tasks[2].completed).toBe(true);
  });

  test('does not parse callout tasks even when callouts are enabled', () => {
    const parser = TaskParser.create(createSettings({ includeCalloutBlocks: true }));
    const content = '>[!note]\n> TODO hidden in callout';
    const tasks = parser.parseFile(content, 'test.md');

    expect(tasks).toHaveLength(0);
  });
});

describe('Strict contract inside code blocks', () => {
  test('parses strict keyword lines when code blocks are enabled', () => {
    const parser = TaskParser.create(createSettings({ includeCodeBlocks: true }));
    const content = [
      '```',
      'TODO in code block',
      '```',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].text).toBe('in code block');
  });

  test('does not parse legacy syntax inside code blocks', () => {
    const parser = TaskParser.create(createSettings({ includeCodeBlocks: true }));
    const content = [
      '```',
      '- TODO legacy in code block',
      '```',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(0);
  });
});
