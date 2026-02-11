import { TaskParser } from '../src/parser/task-parser';
import { DEFAULT_SETTINGS, TodoTrackerSettings } from '../src/settings/defaults';

function createSettings(overrides: Partial<TodoTrackerSettings> = {}): TodoTrackerSettings {
  return {
    ...DEFAULT_SETTINGS,
    todoKeywords: ['TODO', 'WAIT', 'ASK'],
    doingKeywords: ['DOING', 'IN PROGRESS'],
    doneKeywords: ['DONE', 'FACT'],
    scheduledKeywords: ['PLAN'],
    deadlineKeywords: ['DUE'],
    priorityQueues: [['#A', '#B', '#C'], ['P1', 'P2', 'P3']],
    priorityKeywords: [],
    workflows: [['TODO', 'DOING', 'DONE']],
    includeCalloutBlocks: true,
    includeCodeBlocks: false,
    languageCommentSupport: { enabled: false },
    blockKeywords: ['END-FLOW'],
    blockDelimiterPresets: ['END-FLOW'],
    ...overrides,
  };
}

describe('TaskParser strict behavior', () => {
  test('supports default keyword groups in strict mode', () => {
    const parser = TaskParser.create(createSettings());
    const content = [
      'TODO pending',
      'DOING active',
      'DONE complete',
      'ASK question',
      'FACT answer',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(5);
    expect(tasks[0].completed).toBe(false);
    expect(tasks[2].completed).toBe(true);
    expect(tasks[3].state).toBe('ASK');
    expect(tasks[4].state).toBe('FACT');
  });

  test('keeps strict rule when parsing mixed content', () => {
    const parser = TaskParser.create(createSettings());
    const content = [
      'TODO valid',
      '- TODO legacy bullet',
      '1. TODO legacy numbered',
      'DOING valid too',
      'text TODO in sentence',
      '  DONE indented valid',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(3);
    expect(tasks[0].text).toBe('valid');
    expect(tasks[1].text).toBe('valid too');
    expect(tasks[2].text).toBe('indented valid');
  });

  test('parses dates using configured aliases', () => {
    const parser = TaskParser.create(createSettings());
    const content = [
      'TODO alias dates',
      'PLAN: <2026-03-01>',
      'DUE: <2026-03-05>',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].scheduledSymbol).toBe('PLAN');
    expect(tasks[0].deadlineSymbol).toBe('DUE');
  });

  test('accepts legacy aliases as temporary compatibility', () => {
    const parser = TaskParser.create(createSettings({ scheduledKeywords: ['PLAN'], deadlineKeywords: ['DUE'] }));
    const content = [
      'TODO legacy aliases still parse',
      'SCHEDULED: <2026-03-01>',
      'DEADLINE: <2026-03-05>',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].scheduledDate).not.toBeNull();
    expect(tasks[0].deadlineDate).not.toBeNull();
  });

  test('captures block content from indented lines without delimiters', () => {
    const parser = TaskParser.create(createSettings());
    const content = [
      'TODO parent task',
      '    - child context line',
      '    another context line',
      'TODO next task',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(2);
    expect(tasks[0].blockContent).toEqual(['    - child context line', '    another context line']);
    expect(tasks[0].blockEndLine).toBe(2);
  });

  test('does not parse tasks in callouts/quotes', () => {
    const parser = TaskParser.create(createSettings({ includeCalloutBlocks: true }));
    const content = [
      '> TODO quoted',
      '>[!info] TODO callout',
      'TODO normal',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].text).toBe('normal');
  });

  test('ignores tasks inside math and comment blocks', () => {
    const parser = TaskParser.create(createSettings());
    const content = [
      '$$',
      'TODO hidden in comment block',
      '$$',
      '%%',
      'TODO hidden in math block',
      '%%',
      'TODO visible',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].text).toBe('visible');
  });
});

describe('TaskParser with code blocks', () => {
  test('ignores code blocks when disabled', () => {
    const parser = TaskParser.create(createSettings({ includeCodeBlocks: false }));
    const content = [
      '```',
      'TODO inside code',
      '```',
      'TODO outside code',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].text).toBe('outside code');
  });

  test('parses strict syntax inside code blocks when enabled', () => {
    const parser = TaskParser.create(createSettings({ includeCodeBlocks: true }));
    const content = [
      '```',
      'TODO inside code',
      '- TODO legacy in code',
      '```',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].text).toBe('inside code');
  });

  test('parses language comments only when language support is enabled', () => {
    const parser = TaskParser.create(
      createSettings({
        includeCodeBlocks: true,
        languageCommentSupport: { enabled: true },
      }),
    );
    const content = [
      '```java',
      '// TODO from language comment',
      'public class Demo {}',
      '```',
    ].join('\n');

    const tasks = parser.parseFile(content, 'test.md');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].rawText).toContain('TODO from language comment');
  });
});
