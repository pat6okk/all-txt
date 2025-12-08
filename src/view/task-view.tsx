import { ItemView, WorkspaceLeaf, Menu, TFile, Platform, MarkdownView, setIcon } from 'obsidian';
import { TaskEditor } from './task-editor';
import { Task, TaskViewMode } from '../task';
import { DateUtils } from './date-utils';
import { WorkflowService } from '../services/workflow-service';
import { TaskStore } from '../services/task-store';
import { SortMethod } from '../settings/defaults';

// React Imports
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { TodoViewRoot } from '../ui/view/TodoViewRoot';

export const TASK_VIEW_ICON = "list-todo";

export class TodoView extends ItemView {
  static viewType = "todoinline-view";
  tasks: Task[];
  editor: TaskEditor;

  // State
  private searchQuery = "";
  private defaultViewMode: TaskViewMode;
  private filterActive = false;

  // React Root
  private root: Root | null = null;

  // Dependencies
  private workflowService: WorkflowService;
  private taskStore: TaskStore;
  private onPersist: () => Promise<void>;

  constructor(
    leaf: WorkspaceLeaf,
    taskStore: TaskStore,
    defaultViewMode: TaskViewMode,
    workflowService: WorkflowService,
    onPersist: () => Promise<void>
  ) {
    super(leaf);
    this.taskStore = taskStore;
    this.tasks = this.taskStore.getTasks();
    this.editor = new TaskEditor(this.app);
    this.defaultViewMode = defaultViewMode;
    this.workflowService = workflowService;
    this.onPersist = onPersist;
  }

  getViewType(): string {
    return TodoView.viewType;
  }

  getDisplayText(): string {
    return "Todo Inline View";
  }

  getIcon(): string {
    return TASK_VIEW_ICON;
  }

  /**
   * Helper to determine effective View Mode
   */
  private getViewMode(): TaskViewMode {
    // Prioritize persisted setting
    if (this.taskStore.getSettings().taskViewMode) {
      return this.taskStore.getSettings().taskViewMode;
    }
    return this.defaultViewMode || 'default';
  }

  private getSortMethod(): SortMethod {
    if (this.taskStore.getSettings().sortMethod) {
      return this.taskStore.getSettings().sortMethod;
    }
    return 'default';
  }

  async onOpen() {
    this.renderReactRoot();

    // Subscribe to store updates
    this.registerEvent(
      this.taskStore.on('update', () => {
        this.tasks = this.taskStore.getTasks();
        this.refreshVisibleList();
      })
    );
  }

  async onClose() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  /**
   * Renders or Re-renders the React Text
   */
  private renderReactRoot() {
    const container = this.contentEl;

    if (!this.root) {
      this.root = createRoot(container);
    }

    // Filter tasks based on Search Query and Active File
    let displayTasks = this.tasks;

    // 1. Filter Active
    if (this.filterActive) {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        displayTasks = displayTasks.filter(t => t.path === activeFile.path);
      } else {
        displayTasks = [];
      }
    }

    // 2. Search Query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      displayTasks = displayTasks.filter(t =>
        t.rawText.toLowerCase().includes(q) || t.path.toLowerCase().includes(q)
      );
    }

    // 3. View Mode & Sort Logic (Moved logic to simple sorts here or delegate to React? 
    //    Ideally we reuse `transformForView` logic but modernized.
    displayTasks = this.transformForView(displayTasks, this.getViewMode());


    this.root.render(
      <TodoViewRoot
        tasks={displayTasks}
        allTasksCount={this.tasks.length}
        searchQuery={this.searchQuery}
        viewMode={this.getViewMode()}
        sortMethod={this.getSortMethod()}
        filterActive={this.filterActive}

        // Actions
        onSearchChange={(q) => { this.searchQuery = q; this.refreshVisibleList(); }}
        onViewModeChange={async (m) => {
          this.taskStore.getSettings().taskViewMode = m;
          await this.saveSettings();
          this.refreshVisibleList();
        }}
        onSortMethodChange={async (m) => {
          this.taskStore.getSettings().sortMethod = m;
          await this.saveSettings();
          this.refreshVisibleList();
        }}
        onFilterActiveChange={(a) => { this.filterActive = a; this.refreshVisibleList(); }}

        // Task Interactions (Delegating to Editor/Service)
        onUpdateState={(t, s) => {
          const isCompleted = this.workflowService.isCompleted(s);
          this.editor.updateTaskState(t, s, isCompleted);
        }}
        onToggle={(t) => {
          const next = this.workflowService.getNextState(t.state);
          const isCompleted = this.workflowService.isCompleted(next);
          this.editor.updateTaskState(t, next, isCompleted);
        }}
        onOpenTask={(t, e) => this.openTaskLocation(t, e)}
        onUpdatePriority={(t, p) => this.editor.updateTaskPriority(t, p)}
        onPriorityContextMenu={(t, e) => this.openPriorityMenuAtMouseEvent(t, e.nativeEvent)}

        // Utils
        getKeywordColor={(k) => this.workflowService.getKeywordColor(k)}
        getNextState={(s) => this.workflowService.getNextState(s)}
        getNextPriority={(p) => this.workflowService.getNextPriority(p)} // Add helper
        getContrastColor={(hex) => this.getContrastColor(hex)}

        // New Props
        onContextMenu={(t, e) => this.openStateMenuAtMouseEvent(t, e.nativeEvent)}
        formatDate={(d, t) => DateUtils.formatDateForDisplay(d, t)}
        getDateClasses={(d, isDeadline) => this.getDateStatusClasses(d, isDeadline)}

        // Phase 17 Data
        keywordDescriptions={this.taskStore.getSettings().keywordDescriptions || {}}
        scheduledColor={this.workflowService.getKeywordColor(this.taskStore.getSettings().scheduledKeywords[0] || 'SCHEDULED')}
        deadlineColor={this.workflowService.getKeywordColor(this.taskStore.getSettings().deadlineKeywords[0] || 'DEADLINE')}

        // Phase 17b Labels
        scheduledKeyword={this.taskStore.getSettings().scheduledKeywords[0] || 'SCHEDULED'}
        deadlineKeyword={this.taskStore.getSettings().deadlineKeywords[0] || 'DEADLINE'}
      />
    );
  }

  setViewMode(mode: TaskViewMode) {
    this.contentEl.setAttr('data-view-mode', mode);
  }

  private getDateStatusClasses(date: Date | null, isDeadline = false): string[] {
    if (!date) return [];

    // Simple implementation based on legacy logic
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diff = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diff / (1000 * 3600 * 24));

    const classes = [];
    if (diffDays < 0) classes.push('todo-date-overdue');
    if (diffDays === 0) classes.push('todo-date-today');
    if (isDeadline) classes.push('todo-date-deadline');
    // Ensure text color classes match Obsidian theme vars usually handled by these classes
    return classes;
  }

  // Exposed method for Settings/Store to trigger refresh
  public refreshVisibleList() {
    this.renderReactRoot();
  }



  private async saveSettings() {
    if (this.onPersist) {
      await this.onPersist();
    }
  }

  // --- Logic Helpers Copied/Adapated from Original ---

  private transformForView(tasks: Task[], mode: TaskViewMode): Task[] {
    let transformed = tasks.slice();

    // 1. Hide Completed
    if (mode === 'hideCompleted') {
      transformed = transformed.filter(t => !t.completed);
    }

    // 2. Sort
    if (mode === 'sortCompletedLast') {
      transformed.sort((a, b) => {
        // File Path
        const pathCompare = a.path.localeCompare(b.path);
        if (pathCompare !== 0) return pathCompare;
        // Completed
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        // Line
        return a.line - b.line;
      });
    } else {
      this.applySortToTasks(transformed);
    }
    return transformed;
  }

  private applySortToTasks(tasks: Task[]): void {
    const sortMethod = this.getSortMethod();

    if (sortMethod === 'default') {
      tasks.sort((a, b) => {
        const pathCompare = a.path.localeCompare(b.path);
        if (pathCompare !== 0) return pathCompare;
        return a.line - b.line;
      });
    } else if (sortMethod === 'sortByScheduled') {
      tasks.sort((a, b) => {
        if (!a.scheduledDate && !b.scheduledDate) return 0;
        if (!a.scheduledDate) return 1;
        if (!b.scheduledDate) return -1;
        return a.scheduledDate.getTime() - b.scheduledDate.getTime();
      });
    } else if (sortMethod === 'sortByDeadline') {
      tasks.sort((a, b) => {
        if (!a.deadlineDate && !b.deadlineDate) return 0;
        if (!a.deadlineDate) return 1;
        if (!b.deadlineDate) return -1;
        return a.deadlineDate.getTime() - b.deadlineDate.getTime();
      });
    } else if (sortMethod === 'sortByPriority') {
      // Simple priority sort
      tasks.sort((a, b) => {
        if (!a.priority && !b.priority) return 0;
        if (!a.priority) return 1;
        if (!b.priority) return -1;
        return a.priority.localeCompare(b.priority);
      });
    }
  }

  private getContrastColor(hex: string): string {
    if (!hex || hex.length < 7) return 'black'; // fallback
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
  }

  private async openTaskLocation(task: Task, event: React.MouseEvent | MouseEvent) {
    const file = this.app.vault.getAbstractFileByPath(task.path);
    if (file instanceof TFile) {
      const leaf = this.app.workspace.getLeaf(
        (event as MouseEvent).ctrlKey || (event as MouseEvent).metaKey
      );
      await leaf.openFile(file, { eState: { line: task.line } });

      // Highlight line
      const view = leaf.view;
      if (view instanceof MarkdownView) {
        view.editor.setCursor({ line: task.line, ch: 0 });
        view.editor.scrollIntoView({ from: { line: task.line, ch: 0 }, to: { line: task.line, ch: 0 } }, true);
      }
    }
  }

  private openStateMenuAtMouseEvent(task: Task, evt: MouseEvent) {
    const menu = new Menu();

    // Helper to add sections
    const addSection = (header: string, keywords: string[]) => {
      if (!keywords.length) return;
      menu.addItem(item => {
        item.setTitle(header).setIsLabel(true); // Obsidian API 1.0+ supports setIsLabel usually, or setDisabled effectively
        item.setIcon('hash'); // Optional icon
      });

      keywords.forEach(state => {
        menu.addItem(item => {
          item.setTitle(state)
            .setChecked(task.state === state)
            .onClick(() => {
              const isCompleted = this.workflowService.isCompleted(state);
              this.editor.updateTaskState(task, state, isCompleted);
            });
        });
      });
      menu.addSeparator();
    };

    addSection("Pending", this.workflowService.getPendingKeywords());
    addSection("Active", this.workflowService.getActiveKeywords());
    addSection("Completed", this.workflowService.getCompletedKeywords());

    menu.showAtMouseEvent(evt);
  }

  private openPriorityMenuAtMouseEvent(task: Task, evt: MouseEvent) {
    const menu = new Menu();
    const groups = this.workflowService.getPriorityGroups();

    // Removed 'No Priority' option as requested
    // menu.addSeparator(); // Only if needed before groups? 
    // If groups start immediately, maybe no separator needed at top unless we had actions before.
    // The previous code had "Remove Priority" then separator. I'll remove both.

    groups.forEach((group, index) => {
      if (group.length === 0) return;

      group.forEach(p => {
        menu.addItem(item => {
          item.setTitle(p)
            .setChecked(task.priority === p)
            .onClick(() => this.editor.updateTaskPriority(task, p));
        });
      });

      // Add separator after group if it's not the last group
      if (index < groups.length - 1) {
        menu.addSeparator();
      }
    });

    menu.showAtMouseEvent(evt);
  }
}
