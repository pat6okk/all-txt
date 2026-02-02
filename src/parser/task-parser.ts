import { Task, SubTask, DEFAULT_COMPLETED_STATES, DEFAULT_PENDING_STATES, DEFAULT_ACTIVE_STATES } from '../task';
import { TodoTrackerSettings } from "../settings/defaults";
import { LanguageRegistry, LanguageDefinition, LanguageCommentSupportSettings } from "./language-registry";
import { DateParser } from "./date-parser";

type RegexPair = { test: RegExp; capture: RegExp };

// List marker patterns
// Bullet points: matches -, *, or + characters
const BULLET_LIST_PATTERN = /[-*+]\s+/.source;
// Numbered lists: matches digits followed by . or ) (e.g., "1.", "2)", "12.")
const NUMBERED_LIST_PATTERN = /\d+[.)]\s+/.source;
// Letter lists: matches letters followed by . or ) (e.g., "a.", "B)")
const LETTER_LIST_PATTERN = /[A-Za-z][.)]\s+/.source;
// Custom lists: matches parentheses-enclosed alphanumeric identifiers (e.g., "(A1)", "(A2)")
const CUSTOM_LIST_PATTERN = /\([A-Za-z0-9]+\)\s+/.source;

// Combined list marker pattern
const LIST_MARKER_source = `(?:${BULLET_LIST_PATTERN}|${NUMBERED_LIST_PATTERN}|${LETTER_LIST_PATTERN}|${CUSTOM_LIST_PATTERN})`;
export const LIST_MARKER_REGEX = new RegExp(LIST_MARKER_source);
export const LIST_MARKER_PART = LIST_MARKER_source;

// Checkboxes: [ ] (unchecked), [x] (checked) or [*] (other checkbox states)
const CHECKBOX = /\[[ x\S]\]\s+/.source;

// Leading spaces only
const STANDARD_PREFIX = /\s*/.source;
// Quoted lines with leading ">"
const QUOTED_PREFIX = /\s*>\s*/.source;
// Callout block declaration, e.g. "> [!info]"
const CALLOUT_PREFIX = /\s*>\s*\[!\w+\]-?\s+/.source

// Code block marker ``` or ~~~ with language
const CODE_BLOCK_REGEX = /^\s*(```|~~~)\s*(\S+)?$/
// Math block marker %%
const MATH_BLOCK_REGEX = /^\s*%%(?!.*%%).*/ // ignores open and close on same line
// Comment block marker $$
const COMMENT_BLOCK_REGEX = /^\s*\$\$(?!.*\$\$).*/ // ignores open and close on same line
// Callout block marker >
const CALLOUT_BLOCK_REGEX = /^\s*>.*/

// Language code before comment - non greedy
const CODE_PREFIX = /\s*[\s\S]*?/.source

const TASK_TEXT = /[\w[].+?/.source;  // at least one word


export class TaskParser {
  private readonly testRegex: RegExp;
  private readonly captureRegex: RegExp;
  private readonly includeCalloutBlocks: boolean;
  private readonly includeCodeBlocks: boolean;
  private readonly languageCommentSupport: LanguageCommentSupportSettings;
  private readonly allKeywords: string[];
  private readonly completedKeywords: Set<string>;

  // Language support components (lazy-loaded)
  private languageRegistry: LanguageRegistry | null = null;

  // Language state tracking
  private currentLanguage: LanguageDefinition | null = null;

  // Dynamic settings
  private scheduledKeywords: string[];
  private deadlineKeywords: string[];
  private priorityKeywords: string[];
  private priorityQueues: string[][];

  private constructor(
    regex: RegexPair,
    includeCalloutBlocks: boolean,
    includeCodeBlocks: boolean,
    languageCommentSupport: LanguageCommentSupportSettings,
    allKeywords: string[],
    completedKeywords: Set<string>,
    scheduledKeywords: string[],
    deadlineKeywords: string[],
    priorityQueues: string[][]
  ) {
    this.allKeywords = allKeywords;
    this.completedKeywords = completedKeywords;
    this.scheduledKeywords = scheduledKeywords;
    this.deadlineKeywords = deadlineKeywords;
    this.priorityQueues = priorityQueues;
    this.priorityKeywords = priorityQueues.flat(); // Flattened for regex building

    this.testRegex = regex.test;
    this.captureRegex = regex.capture;

    this.includeCalloutBlocks = includeCalloutBlocks;
    this.includeCodeBlocks = includeCodeBlocks;
    this.languageCommentSupport = languageCommentSupport;
  }


  static create(settings: TodoTrackerSettings): TaskParser {
    // defaults if settings are somehow missing
    const todos = settings.todoKeywords?.length ? settings.todoKeywords : Array.from(DEFAULT_PENDING_STATES);
    const doings = settings.doingKeywords?.length ? settings.doingKeywords : Array.from(DEFAULT_ACTIVE_STATES);
    const dones = settings.doneKeywords?.length ? settings.doneKeywords : Array.from(DEFAULT_COMPLETED_STATES);

    const completedSet = new Set(dones);
    const allKeywordsArray: string[] = [
      ...todos,
      ...doings,
      ...dones
    ];

    // Ensure we handle legacy settings structure if priorityQueues missing
    let pQueues = settings.priorityQueues;
    if (!pQueues || pQueues.length === 0) {
      if (settings.priorityKeywords && settings.priorityKeywords.length > 0) {
        pQueues = [settings.priorityKeywords];
      } else {
        pQueues = [['#A', '#B', '#C']];
      }
    }

    const regex = TaskParser.buildRegex(allKeywordsArray);
    return new TaskParser(
      regex,
      settings.includeCalloutBlocks,
      settings.includeCodeBlocks,
      settings.languageCommentSupport,
      allKeywordsArray,
      completedSet,
      settings.scheduledKeywords || ['SCHEDULED'],
      settings.deadlineKeywords || ['DEADLINE'],
      pQueues
    );
  }

  /**
   * Escape keywords for use in regex patterns
   * @param keywords Array of keywords to escape
   * @returns Escaped keywords joined with OR operator
   */
  private static escapeKeywords(keywords: string[]): string {
    return keywords
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
  }

  /**
   * Build regex patterns with customizable components
   * US-1.1: Strict Header Detection - Only detects keywords at line start (with optional indentation)
   * @param keywords Array of task keywords
   * @returns RegexPair for testing and capturing tasks
   */
  private static buildRegex(
    keywords: string[],
  ): RegexPair {

    const escaped_keywords = TaskParser.escapeKeywords(keywords);

    // US-1.1: Simplified regex - no list markers, no checkboxes, no blockquotes
    // Format: ^(\s*)(KEYWORD)\s+(.*)
    // Group 1: Leading whitespace (indentation)
    // Group 2: The keyword
    // Group 3: The task text
    const test = new RegExp(
      `^(\\s*)`                    // Leading whitespace only
      + `(${escaped_keywords})`   // Keyword
      + `\\s+`                     // Required space after keyword
      + `(.+)$`                    // Task text (rest of line)
    );
    const capture = test;
    return { test, capture };
  }

  /**
   * Build code language regex patterns with customizable components
   * @param keywords Array of task keywords
   * @param languageDefinition Language specific config
   * @returns RegexPair for testing and capturing tasks
   */
  private static buildCodeRegex(
    keywords: string[],
    languageDefinition: LanguageDefinition,
  ): RegexPair {

    const escapedKeywords = TaskParser.escapeKeywords(keywords);

    // starts with mutliline or singleline
    const startComment = [
      languageDefinition.patterns.singleLine?.source,
      languageDefinition.patterns.multiLineStart?.source
    ].filter(Boolean).join('|');
    const midComment = languageDefinition.patterns.multilineMid?.source || '.*?';
    const endComment = `\\s+${languageDefinition.patterns.multiLineEnd?.source}\\s*` || '';

    const test = new RegExp(
      `^((?:(?:${CODE_PREFIX})?(?:(?:${startComment})\\s+))|(?:${midComment}\\s*))`
      + `(${BULLET_LIST_PATTERN}|${NUMBERED_LIST_PATTERN}|${LETTER_LIST_PATTERN}|${CUSTOM_LIST_PATTERN})??`
      + `(${CHECKBOX})?`
      + `(${escapedKeywords})\\s+`
      + `(${TASK_TEXT})`
      + `(?=${endComment}$|$)?(${endComment})?$`
    );
    const capture = test;
    return { test, capture };
  }

  /**
   * Extract task details from a line using appropriate regex
   * US-1.1: Updated for simplified regex groups
   * @param line The line containing the task
   * @returns Parsed task details
   */
  private extractTaskDetails(line: string, regex: RegExp): {
    indent: string;
    listMarker: string;
    taskText: string;
    tail: string;
    state: string;
  } {
    // Use language-aware regex if applicable or callout regex for callout tasks   
    const m = regex.exec(line);
    if (!m) {
      throw new Error(`Failed to parse task line: ${line}`);
    }

    // US-1.1: Simplified regex groups
    // m[0] is the full match
    // m[1] is the leading whitespace (indentation)
    // m[2] is the state keyword
    // m[3] is the task text
    const indent = m[1] || "";
    const listMarker = ""; // No list markers in strict mode
    const state = m[2];
    const taskText = m[3];
    const tail = ""; // No tail in strict mode

    return {
      indent,
      listMarker,
      taskText,
      tail,
      state,
    };
  }

  /**
   * Extract priority from task text
   * @param taskText The task text to parse
   * @returns Priority information
   */
  private extractPriority(taskText: string): { priority: string | null; priorityLabel: string; cleanedText: string } {
    let priority: string | null = null;
    let priorityLabel = '';
    let cleanedText = taskText;

    // Use globally flattened keywords list for detection
    // Sort by length detailed to ensure longest matches first (e.g. P12 before P1)
    const sorted = [...this.priorityKeywords].sort((a, b) => b.length - a.length);
    const escapedPriorities = TaskParser.escapeKeywords(sorted);

    // Regex to match [TOKEN] or TOKEN (surrounded by whitespace or start/end)
    // Group 1: Leading whitespace
    // Group 2: The full match ([#A] or P1)
    // Group 3: The token inside brackets (#A)
    // Group 4: The naked token (P1)
    // Group 5: Trailing whitespace
    const priRegex = new RegExp(`(\\s*)(\\[(${escapedPriorities})\\]|(?<=^|\\s)(${escapedPriorities})(?=$|\\s))(\\s*)`);

    const priMatch = priRegex.exec(cleanedText);
    if (priMatch) {
      priority = priMatch[3] || priMatch[4]; // Extract the actual token
      priorityLabel = priMatch[2]; // The full label found in text

      const before = cleanedText.slice(0, priMatch.index);
      const after = cleanedText.slice(priMatch.index + priMatch[0].length);
      cleanedText = (before + ' ' + after).replace(/[ \t]+/g, ' ').trimStart();
    }

    return { priority, priorityLabel, cleanedText };
  }

  /**
   * Extract checkbox state from task line
   * @param line The task line to parse
   * @param state The current state
   * @param listMarker The current list marker
   * @returns Updated state, completion status, and list marker
   */
  private extractCheckboxState(line: string, state: string, listMarker: string): {
    state: string;
    completed: boolean;
    listMarker: string;
  } {
    let finalState = state;
    let finalCompleted = this.completedKeywords.has(state);
    let finalListMarker = listMarker;

    // Check if this is a markdown checkbox task and extract checkbox status
    // For callout blocks, we need to handle the > prefix
    let checkboxMatch = line.match(/^(\s*)([-*+]\s*\[(\s|x)\]\s*)\s+([^\s]+)\s+(.+)$/);
    if (!checkboxMatch && line.startsWith('>')) {
      // Try again without the > prefix for callout blocks
      checkboxMatch = line.substring(1).match(/^(\s*)([-*+]\s*\[(\s|x)\]\s*)\s+([^\s]+)\s+(.+)$/);
    }

    if (checkboxMatch) {
      // map groups from match
      const [, /*checkboxIndent*/, checkboxListMarker, checkboxStatus, checkboxState, /*checkboxText*/] = checkboxMatch;
      finalState = checkboxState;
      finalCompleted = checkboxStatus === 'x';
      // Update listMarker to preserve the original checkbox format, but trim trailing spaces
      finalListMarker = checkboxListMarker.trimEnd();
    }

    return { state: finalState, completed: finalCompleted, listMarker: finalListMarker };
  }

  /**
   * Check if a line contains SCHEDULED: or DEADLINE:
   * @returns Match object with type and keyword, or null
   */
  getDateLineInfo(line: string, taskIndent: string): { type: 'scheduled' | 'deadline', keyword: string } | null {
    const trimmedLine = line.trim();

    // Helper to find matching keyword
    const findMatch = (keywords: string[]): string | undefined => {
      // Look for KEYWORD: or KEYWORD (with or without colon) at start of content
      // Handle > prefix for quotes
      const content = line.startsWith('>') ? trimmedLine.substring(1).trim() : trimmedLine;
      return keywords.find(k => {
        // Match "KEYWORD:" or "KEYWORD " (space after keyword)
        return content.startsWith(k + ':') || content.startsWith(k + ' ');
      });
    };

    // Check scheduled
    const schedKw = findMatch(this.scheduledKeywords);
    if (schedKw) return { type: 'scheduled', keyword: schedKw };

    // Check deadline
    const deadKw = findMatch(this.deadlineKeywords);
    if (deadKw) return { type: 'deadline', keyword: deadKw };

    return null;
  }

  /**
   * Parse a date from a line containing SCHEDULED: or DEADLINE: prefix
   * @param line The line to parse
   * @param keyword The specific keyword found to strip
   */
  parseDateFromLine(line: string, keyword: string): Date | null {
    // Escaped keyword
    const escaped = TaskParser.escapeKeywords([keyword]);
    // Regex: ^[ >]* (KEYWORD):? \s*  (colon is now optional)
    const prefixRegex = new RegExp(`^(\\s*>\\s*|\\s*)(${escaped}):?\\s*`);
    const content = line.replace(prefixRegex, '').trim();
    return DateParser.parseDate(content);
  }

  /**
   * Extract scheduled and deadline dates from lines following a task
   */
  private extractTaskDates(
    lines: string[],
    startIndex: number,
    indent: string,
  ): { scheduledDate: Date | null; deadlineDate: Date | null; scheduledSymbol?: string; deadlineSymbol?: string } {
    let scheduledDate: Date | null = null;
    let deadlineDate: Date | null = null;
    let scheduledSymbol: string | undefined;
    let deadlineSymbol: string | undefined;

    let scheduledFound = false;
    let deadlineFound = false;

    for (let i = startIndex; i < lines.length; i++) {
      const nextLine = lines[i];

      const nextLineTrimmed = nextLine.trim();
      if (nextLineTrimmed === '') {
        continue;
      }

      const lineIndent = nextLine.substring(0, nextLine.length - nextLineTrimmed.length);
      const isQuoted = nextLine.startsWith('>');

      // Strict indentation check: dates must be at same or deeper indent level
      if (!isQuoted && lineIndent !== indent && !lineIndent.startsWith(indent)) {
        break;
      }

      const info = this.getDateLineInfo(nextLine, indent);

      if (info?.type === 'scheduled' && !scheduledFound) {
        const date = this.parseDateFromLine(nextLine, info.keyword);
        if (date) {
          scheduledDate = date;
          scheduledSymbol = info.keyword;
          scheduledFound = true;
        }
      } else if (info?.type === 'deadline' && !deadlineFound) {
        const date = this.parseDateFromLine(nextLine, info.keyword);
        if (date) {
          deadlineDate = date;
          deadlineSymbol = info.keyword;
          deadlineFound = true;
        }
      } else {
        // If not a date line, stop
        // Wait, original logic: "if (dateLineType === null) break;"
        if (!info) {
          break;
        }
      }

      if (scheduledFound && deadlineFound) break;
    }

    return { scheduledDate, deadlineDate, scheduledSymbol, deadlineSymbol };
  }



  // Parse a single file content into Task[], pure and stateless w.r.t. external app
  parseFile(content: string, path: string): Task[] {
    const lines = content.split('\n');

    // Initialize state machine
    let inBlock = false;
    let blockMarker: 'code' | 'math' | 'comment' | null = null;
    let codeRegex = null

    const tasks: Task[] = [];

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];

      // skip blank lines
      if (line.trim() == '') {
        continue;
      }
      // check for change of context
      if (CODE_BLOCK_REGEX.test(line)) {
        if (!inBlock) {
          if (this.includeCodeBlocks) {
            // starting a new code block, detect the coding language
            if (this.languageCommentSupport.enabled) {
              const m = CODE_BLOCK_REGEX.exec(line)
              // m[0] is the full match
              // m[1] is block marker
              // m[2] is the language
              // get the language from the registry
              this.detectLanguage(m ? m[2] : "")
              if (this.currentLanguage) {
                codeRegex = TaskParser.buildCodeRegex(this.allKeywords, this.currentLanguage)
              } else {
                codeRegex = null
              }
            }
          }
        }
        inBlock = !inBlock
        blockMarker = inBlock ? 'code' : null
        continue;
      } else if (MATH_BLOCK_REGEX.test(line)) {
        inBlock = !inBlock
        blockMarker = inBlock ? 'math' : null
      } else if (COMMENT_BLOCK_REGEX.test(line)) {
        inBlock = !inBlock
        blockMarker = inBlock ? 'comment' : null
      }

      // Skip lines in quotes and callout blocks if disabled 
      if (!this.includeCalloutBlocks && CALLOUT_BLOCK_REGEX.test(line)) {
        continue;
      }

      // Skip lines inside code blocks if disabled
      if (inBlock && !this.includeCodeBlocks && blockMarker === 'code') {
        continue;
      }

      // Skip lines inside math blocks
      if (inBlock && blockMarker === 'math') {
        continue;
      }

      // Skip lines inside comment blocks
      if (inBlock && blockMarker === 'comment') {
        continue;
      }

      // first use the test regex to see if this line has a task
      const useCodeRegex = inBlock && this.includeCodeBlocks && blockMarker == 'code' && this.currentLanguage
      if (useCodeRegex && codeRegex) {
        if (!codeRegex.test.test(line)) {
          continue;
        }
      }
      else if (!this.testRegex.test(line)) {
        continue;
      }

      // Extract task details using the regular are langauge speciifc code regex
      const taskDetails = this.extractTaskDetails(line, (useCodeRegex && codeRegex) ? codeRegex.capture : this.captureRegex);

      // Extract priority
      const { priority, priorityLabel, cleanedText } = this.extractPriority(taskDetails.taskText);

      // US-1.1: No checkbox extraction needed in strict mode
      // State is directly from the keyword, completed status from completedKeywords set
      const finalState = taskDetails.state;
      const finalCompleted = this.completedKeywords.has(finalState);

      // Initialize task with date fields
      const task: Task = {
        path,
        line: index,
        rawText: line,
        indent: taskDetails.indent,
        listMarker: taskDetails.listMarker, // Will be empty string in strict mode
        text: cleanedText,
        state: finalState,
        completed: finalCompleted,
        priority,
        priorityLabel,
        scheduledDate: null,
        deadlineDate: null,
        tail: taskDetails.tail,
      };

      // US-1.2: Block Parsing Logic
      // KEY RULE: Only capture block content if there is an EXPLICIT --- delimiter
      const blockContent: string[] = [];
      const subtasks: SubTask[] = [];
      let blockEndLine = index;

      // First, scan ahead to see if there IS a --- delimiter
      let delimiterFound = false;
      let delimiterLine = -1;

      for (let scan = index + 1; scan < lines.length; scan++) {
        const scanLine = lines[scan].trim();

        // Stop scanning if we hit another keyword at same/lesser indentation
        if (this.testRegex.test(lines[scan])) {
          const scanMatch = this.captureRegex.exec(lines[scan]);
          if (scanMatch) {
            const scanIndent = scanMatch[1] || "";
            if (scanIndent.length <= taskDetails.indent.length) {
              break; // Next task found, stop scanning
            }
          }
        }

        // Check for delimiter
        if (scanLine === '---') {
          delimiterFound = true;
          delimiterLine = scan;
          break;
        }
      }

      // ONLY capture block content if we found a --- delimiter
      if (delimiterFound && delimiterLine > index) {
        for (let j = index + 1; j < delimiterLine; j++) {
          const nextLine = lines[j];
          const nextLineTrimmed = nextLine.trim();

          // Skip completely empty lines
          if (nextLineTrimmed === '') {
            blockContent.push(nextLine);
            continue;
          }

          // Check if this line is a date metadata line (SCHEDULED, DEADLINE, etc.)
          // These should NOT be part of blockContent; they'll be parsed by extractTaskDates
          const dateInfo = this.getDateLineInfo(nextLine, taskDetails.indent);
          if (dateInfo) {
            // This is a date line, skip it from blockContent
            continue;
          }

          // Line is part of the block content
          blockContent.push(nextLine);
          blockEndLine = j;

          // Detect subtasks within the block
          const subtaskMatch = nextLine.match(/^(\s*)[-*+]\s\[([ xX])\]\s+(.+)$/);
          if (subtaskMatch) {
            subtasks.push({
              indent: subtaskMatch[1],
              text: subtaskMatch[3],
              completed: subtaskMatch[2].toLowerCase() === 'x',
              line: j
            });
          }
        }

        // Set blockEndLine to the delimiter line
        blockEndLine = delimiterLine;
      }

      task.blockContent = blockContent;
      task.subtasks = subtasks;
      task.blockEndLine = blockEndLine;

      // Extract dates from following lines (metadata)
      const { scheduledDate, deadlineDate, scheduledSymbol, deadlineSymbol } = this.extractTaskDates(
        lines,
        index + 1,
        taskDetails.indent,
      );

      task.scheduledDate = scheduledDate;
      task.deadlineDate = deadlineDate;
      task.scheduledSymbol = scheduledSymbol;
      task.deadlineSymbol = deadlineSymbol;

      tasks.push(task);
    }

    return tasks;
  }

  private detectLanguage(lang: string): void {
    // Use getLanguageByIdentifier to support both language names and keywords
    this.currentLanguage = this.getLanguageRegistry().getLanguageByIdentifier(lang);
  }

  /**
   * Lazy-load and return the LanguageRegistry instance
   */
  private getLanguageRegistry(): LanguageRegistry {
    if (!this.languageRegistry) {
      this.languageRegistry = new LanguageRegistry();
    }
    return this.languageRegistry;
  }
}