const FLOW_BLOCK_INDENT = '    ';

function trimOuterEmptyLines(lines: string[]): string[] {
  let start = 0;
  let end = lines.length - 1;

  while (start <= end && lines[start].trim() === '') {
    start += 1;
  }

  while (end >= start && lines[end].trim() === '') {
    end -= 1;
  }

  if (start > end) {
    return [];
  }

  return lines.slice(start, end + 1);
}

function getLeadingWhitespace(line: string): string {
  const match = line.match(/^(\s*)/);
  return match ? match[1] : '';
}

/**
 * Convert free text into canonical FLOW block syntax:
 * - Header line: "<KEYWORD> <title>"
 * - Body lines: indented one level under the header
 */
export function formatSelectionAsFlowBlock(input: string, keyword: string): string | null {
  if (!input.trim()) {
    return null;
  }

  const rawLines = input.split('\n');
  const lines = trimOuterEmptyLines(rawLines);
  if (lines.length === 0) {
    return null;
  }

  const baseIndent = getLeadingWhitespace(lines[0]);
  const normalizedLines = lines.map((line, index) => {
    if (line.trim() === '') {
      return '';
    }

    if (line.startsWith(baseIndent)) {
      return line.slice(baseIndent.length);
    }

    return index === 0 ? line.trimStart() : line;
  });

  const title = normalizedLines[0].trim();
  const safeTitle = title.length > 0 ? title : 'Untitled flow';
  const header = `${baseIndent}${keyword} ${safeTitle}`;

  if (normalizedLines.length === 1) {
    return header;
  }

  const bodyLines = normalizedLines.slice(1).map((line) => {
    if (line.trim() === '') {
      return '';
    }
    return `${baseIndent}${FLOW_BLOCK_INDENT}${line}`;
  });

  return `${header}\n${bodyLines.join('\n')}`;
}
