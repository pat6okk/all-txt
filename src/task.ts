
export interface SubTask {
  indent: string;
  text: string;
  completed: boolean;
  line: number;
}

export interface Task {
  path: string;    // path to the page in the vault
  line: number;    // line number of the task in the page
  rawText: string; // original full line
  indent: string;  // leading whitespace before any list marker/state
  listMarker: string; // the exact list marker plus trailing space if present (e.g., "- ", "1. ", "(a) ")
  text: string;    // content after the state keyword with priority/labels removed
  state: string;   // state keyword, TODO, DOING, DONE etc.
  completed: boolean; // is the task considered complete
  priority: string | null;     // Raw priority token (e.g. "A", "P1") or null if none
  priorityLabel: string;       // The full token found in text (e.g. "[#A]") for display reconstruction
  labels: string[];            // Array of label tokens (e.g. ["Trabajo", "Urgente"]) - Épica 5
  scheduledDate: Date | null; // scheduled date from PLAN: line (legacy alias SCHEDULED supported)
  deadlineDate: Date | null;  // deadline date from DUE: line (legacy alias DEADLINE supported)
  // Phase 1: Original symbols
  scheduledSymbol?: string;
  deadlineSymbol?: string;
  tail?: string;   // trailing end characters after the task text (e.g., " */")

  // Phase 2: Block Content
  blockContent?: string[];
  subtasks?: SubTask[];
  blockEndLine?: number;
}

export type TaskViewMode = 'default' | 'sortCompletedLast' | 'hideCompleted';

export const DEFAULT_PENDING_STATES = new Set<string>(['TODO', 'LATER', 'WAIT', 'WAITING']);
export const DEFAULT_ACTIVE_STATES = new Set<string>(['DOING', 'NOW', 'IN-PROGRESS']);
export const DEFAULT_COMPLETED_STATES = new Set<string>(['DONE', 'CANCELED', 'CANCELLED']);
