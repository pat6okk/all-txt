import { formatSelectionAsFlowBlock } from '../src/editor/flow-block-formatter';

describe('flow block formatter', () => {
  test('formats selection into keyword + indented block', () => {
    const input = [
      'Cocinar la cena',
      'La cena consiste en huevos con arroz:',
      '- 2 huevos',
      '- [ ] romper huevos',
    ].join('\n');

    const output = formatSelectionAsFlowBlock(input, 'TODO');
    expect(output).toBe([
      'TODO Cocinar la cena',
      '    La cena consiste en huevos con arroz:',
      '    - 2 huevos',
      '    - [ ] romper huevos',
    ].join('\n'));
  });

  test('preserves base indentation from selected text', () => {
    const input = [
      '  Cooking dinner',
      '  Notes line',
      '    - [ ] prep ingredients',
    ].join('\n');

    const output = formatSelectionAsFlowBlock(input, 'ASK');
    expect(output).toBe([
      '  ASK Cooking dinner',
      '      Notes line',
      '        - [ ] prep ingredients',
    ].join('\n'));
  });

  test('returns null when input has no content', () => {
    expect(formatSelectionAsFlowBlock('   \n', 'TODO')).toBeNull();
  });
});
