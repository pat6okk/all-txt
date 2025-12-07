import { App, TFile, MarkdownView, EditorPosition } from 'obsidian';
import { Task } from '../task';

export class TaskEditor {
  /**
   * Prefer Editor API for the active file to preserve cursor/selection/folds and UX.
   * Prefer Vault.process for background edits to perform atomic writes.
   */
  constructor(private readonly app: App) { }

  // Pure formatter of a task line given a new state and optional priority retention
  static generateTaskLine(task: Task, newState: string, isCompleted: boolean, keepPriority = true): { newLine: string; completed: boolean } {
    const priorityPart = (keepPriority && task.priority)
      ? ` ${task.priorityLabel || `[#${task.priority}]`}`
      : '';
    // actually, let's keep it simple: " [#A]" space included?
    // The previous logic was `const priToken ? " " + priToken : ""`
    // So if I set priorityPart directly, I should include the leading space IF it's not empty?
    // Or just make sure the interpolation `${priorityPart}` handles it?
    // Line 28: `${newState}${priorityPart} ...`
    // If priorityPart is `[#A]`, we get `- [ ] TODO[#A]...` -> no space.
    // Old logic: `priToken ? " " + priToken : ""` -> added a space.
    // So I need to add a leading space if priority exists.
    const textPart = task.text ? ` ${task.text}` : '';

    // Check if the original task was a markdown checkbox
    const isCheckbox = task.rawText.trim().match(/^(\s*[-*+]\s+)\[(\s|x)\]\s+(\w+)\s+/);
    let newLine: string;

    if (isCheckbox) {
      // Generate markdown checkbox format with proper spacing
      const checkboxStatus = isCompleted ? 'x' : ' ';
      newLine = `${task.indent}- [${checkboxStatus}] ${newState}${priorityPart}${textPart}`;
    } else {
      // Generate original format, preserving comment prefix if present      
      newLine = `${task.indent}${task.listMarker || ''}${newState}${priorityPart}${textPart}`;

      // Add trailing comment end characters if they were present in the original task
      if (task.tail) {
        newLine += task.tail;
      }
    }

    const completed = isCompleted;
    return { newLine, completed };
  }

  // Applies the change and returns an updated, immutable snapshot of the Task
  async applyLineUpdate(task: Task, newState: string, isCompleted: boolean, keepPriority = true): Promise<Task> {
    const { newLine, completed } = TaskEditor.generateTaskLine(task, newState, isCompleted, keepPriority);

    const file = this.app.vault.getAbstractFileByPath(task.path);
    if (file instanceof TFile) {
      // Check if target is the active file in a MarkdownView
      const md = this.app.workspace.getActiveViewOfType(MarkdownView);
      const isActive = md?.file?.path === task.path;
      const editor = md?.editor;

      if (isActive && editor) {
        // Replace only the specific line using Editor API to preserve editor state
        const currentLine = editor.getLine(task.line);
        if (typeof currentLine === 'string') {
          const from: EditorPosition = { line: task.line, ch: 0 };
          const to: EditorPosition = { line: task.line, ch: currentLine.length };
          editor.replaceRange(newLine, from, to);
        }
      } else {
        // Not active: use atomic background edit
        await this.app.vault.process(file, (data) => {
          const lines = data.split('\n');
          if (task.line < lines.length) {
            lines[task.line] = newLine;
          }
          return lines.join('\n');
        });
      }
    }

    // Return an updated Task snapshot (do not mutate original)
    return {
      ...task,
      rawText: newLine,
      state: newState as Task['state'],
      completed,
    };
  }

  // Applt updates to task state
  async updateTaskState(task: Task, nextState: string, isCompleted: boolean): Promise<Task> {
    return await this.applyLineUpdate(task, nextState, isCompleted);
  }
}