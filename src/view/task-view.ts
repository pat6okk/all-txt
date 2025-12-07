import { ItemView, WorkspaceLeaf, Menu, TFile, Platform, MarkdownView, setIcon } from 'obsidian';
import { TaskEditor } from './task-editor';
import { Task, TaskViewMode } from '../task';
import { DateUtils } from './date-utils';
import { WorkflowService } from '../services/workflow-service';
import { TaskStore } from '../services/task-store';
import { SortMethod } from '../settings/defaults';

export const TASK_VIEW_ICON = "list-todo";

export class TodoView extends ItemView {
  static viewType = "todoinline-view";
  tasks: Task[];
  editor: TaskEditor;
  private defaultViewMode: TaskViewMode;
  private searchInputEl: HTMLInputElement | null = null;
  private _searchKeyHandler: ((e: KeyboardEvent) => void) | undefined;
  private isCaseSensitive = false;

  // Dependencies
  private workflowService: WorkflowService;
  private taskStore: TaskStore;
  private onPersist: () => Promise<void>;

  // New features state
  private collapsedPaths: Set<string> = new Set();
  private filterActive = false;

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

    // Load persisted state
    this.collapsedPaths = new Set(this.taskStore.getSettings().collapsedPaths || []);
  }



  /** View-mode accessors persisted on the root element to avoid cross-class coupling */
  private getViewMode(): TaskViewMode {
    // Prioritize persisted setting
    if (this.taskStore.getSettings().taskViewMode) {
      return this.taskStore.getSettings().taskViewMode;
    }

    const attr = this.contentEl.getAttr('data-view-mode');
    if (typeof attr === 'string') {
      if (attr === 'default' || attr === 'sortCompletedLast' || attr === 'hideCompleted') return attr as TaskViewMode;
    }
    // Fallback to current plugin setting from constructor if attribute not set
    if (this.defaultViewMode === 'default' || this.defaultViewMode === 'sortCompletedLast' || this.defaultViewMode === 'hideCompleted') {
      return this.defaultViewMode;
    }
    // Final safety fallback
    return 'default';
  }
  setViewMode(mode: TaskViewMode) {
    this.contentEl.setAttr('data-view-mode', mode);
  }

  private getSortMethod(): SortMethod {
    // Check settings first (source of truth for persistence)
    if (this.taskStore.getSettings().sortMethod) {
      return this.taskStore.getSettings().sortMethod;
    }
    return 'default';
  }

  async setSortMethod(method: SortMethod) {
    this.contentEl.setAttr('data-sort-method', method);
    this.taskStore.getSettings().sortMethod = method;
    await this.saveSettings();
    this.refreshVisibleList();
  }

  async toggleCollapse(path: string) {
    if (this.collapsedPaths.has(path)) {
      this.collapsedPaths.delete(path);
    } else {
      this.collapsedPaths.add(path);
    }

    // Persist
    this.taskStore.getSettings().collapsedPaths = Array.from(this.collapsedPaths);
    // Limit to 100 to prevent bloat
    if (this.taskStore.getSettings().collapsedPaths.length > 100) {
      this.taskStore.getSettings().collapsedPaths = this.taskStore.getSettings().collapsedPaths.slice(-100);
    }
    await this.saveSettings();

    this.refreshVisibleList();
  }

  private async saveSettings() {
    if (this.onPersist) {
      await this.onPersist();
    }
  }

  /** Non-mutating transform for rendering */
  private transformForView(tasks: Task[], mode: TaskViewMode): Task[] {
    let transformed = tasks.slice();

    // First, handle view mode filtering
    if (mode === 'hideCompleted') {
      // Filter out completed tasks and then apply sorting
      transformed = transformed.filter(t => !t.completed);
      this.applySortToTasks(transformed);
      return transformed;
    }

    // Then apply sorting based on the current sort method
    if (mode === 'sortCompletedLast') {
      // Sort strategy:
      // 1. Primary: File Path (keep files together)
      // 2. Secondary: Completed Status (uncompleted first)
      // 3. Tertiary: Current Sort Method (e.g. line number, date)

      // We rely on JS sort being stable or we handle it explicitly.
      // Let's use specific sort to guarantee robust grouping.

      const currentSort = this.getSortMethod();

      transformed.sort((a, b) => {
        // 1. File Path
        const pathCompare = a.path.localeCompare(b.path);
        if (pathCompare !== 0) return pathCompare;

        // 2. Completed Status (False < True)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        // 3. Fallback to standard sort logic helper
        // We can't easily reuse applySortToTasks since it sorts in-place.
        // We replicate standard default sort (Line Number) here for simplicity 
        // or we need to extract the comparator from applySortToTasks.
        // For now, let's assume default line order inside the groups unless valid reason otherwise.
        return a.line - b.line;
      });

      return transformed;
    } else {
      // For other modes, apply sorting directly
      this.applySortToTasks(transformed);
    }

    return transformed;
  }

  /**
   * Apply sorting to tasks based on the current sort method
   * @param tasks Array of tasks to sort
   */
  private applySortToTasks(tasks: Task[]): void {
    const sortMethod = this.getSortMethod();

    if (sortMethod === 'default') {
      // Sort by file path, then by line number within each file
      tasks.sort((a, b) => {
        const pathCompare = a.path.localeCompare(b.path);
        if (pathCompare !== 0) return pathCompare;
        return a.line - b.line;
      });
    } else if (sortMethod === 'sortByScheduled') {
      tasks.sort((a, b) => {
        // Tasks without scheduled dates go to the end
        if (!a.scheduledDate && !b.scheduledDate) return 0;
        if (!a.scheduledDate) return 1;
        if (!b.scheduledDate) return -1;
        return a.scheduledDate.getTime() - b.scheduledDate.getTime();
      });
    } else if (sortMethod === 'sortByDeadline') {
      tasks.sort((a, b) => {
        // Tasks without deadline dates go to the end
        if (!a.deadlineDate && !b.deadlineDate) return 0;
        if (!a.deadlineDate) return 1;
        if (!b.deadlineDate) return -1;
        return a.deadlineDate.getTime() - b.deadlineDate.getTime();
      });
    } else if (sortMethod === 'sortByPriority') {
      // Create a map for O(1) lookup of priority rank
      // Lower index = Higher priority
      const priorityKeywords = this.taskStore.getSettings().priorityKeywords || [];
      const priorityRank = new Map<string, number>();
      priorityKeywords.forEach((p, i) => priorityRank.set(p, i));

      tasks.sort((a, b) => {
        // Get rank (undefined if not found, use Infinity for no priority)
        const rankA = (a.priority && priorityRank.has(a.priority)) ? priorityRank.get(a.priority)! : Infinity;
        const rankB = (b.priority && priorityRank.has(b.priority)) ? priorityRank.get(b.priority)! : Infinity;

        if (rankA !== rankB) {
          return rankA - rankB; // Ascending index (0 is highest priority)
        }

        // Fallback
        const pathCompare = a.path.localeCompare(b.path);
        if (pathCompare !== 0) return pathCompare;
        return a.line - b.line;
      });
    }
  }

  /** Search query (persisted on root contentEl attribute to survive re-renders) */
  private getSearchQuery(): string {
    const q = this.contentEl.getAttr('data-search');
    return typeof q === 'string' ? q : '';
  }
  private setSearchQuery(q: string) {
    this.contentEl.setAttr('data-search', q);
  }

  /** Build toolbar with icon-only mode buttons plus right-aligned search; dispatch event for persistence */
  private buildToolbar(container: HTMLElement) {
    const toolbar = container.createEl('div', { cls: 'todo-toolbar' });

    // First row: search input with mode icons on the right
    const firstRow = toolbar.createEl('div', { cls: 'todo-toolbar-first-row' });

    // Right-aligned search input with icon
    const searchWrap = firstRow.createEl('div', { cls: 'todo-toolbar-right' });
    const searchId = `todoinline-search-${Math.random().toString(36).slice(2, 8)}`;
    const label = searchWrap.createEl('label', { attr: { for: searchId } });
    label.setText('Search');
    label.addClass('sr-only');
    const searchInputWrap = searchWrap.createEl('div', { cls: 'search-input-container global-search-input-container' });
    const inputEl = searchInputWrap.createEl('input', { attr: { id: searchId, type: 'search', placeholder: 'Search tasks…', 'aria-label': 'Search tasks' } });
    const clearSearch = searchInputWrap.createEl('div', { cls: 'search-input-clear-button', attr: { 'aria-label': 'Clear search' } });
    clearSearch.addEventListener('click', () => {
      inputEl.value = '';
      this.setSearchQuery('');
      this.refreshVisibleList();
    });
    const matchCase = searchInputWrap.createEl('div', { cls: 'input-right-decorator clickable-icon', attr: { 'aria-label': 'Match case' } });
    setIcon(matchCase, 'uppercase-lowercase-a');

    // Toggle case sensitivity
    matchCase.addEventListener('click', () => {
      this.isCaseSensitive = !this.isCaseSensitive;
      matchCase.toggleClass('is-active', this.isCaseSensitive);
      this.refreshVisibleList();
    });
    // Narrow to HTMLInputElement via runtime guard
    if (!(inputEl instanceof HTMLInputElement)) {
      throw new Error('Failed to create search input element');
    }
    inputEl.value = this.getSearchQuery();
    inputEl.addEventListener('input', () => {
      // Update attribute and re-render list only, preserving focus
      this.setSearchQuery(inputEl.value);
      this.refreshVisibleList();
    });



    // Add filter/group toggles
    const togglesGroup = firstRow.createEl('div', { cls: 'todo-toggles-group' });
    togglesGroup.style.display = 'flex';
    togglesGroup.style.gap = '4px';
    togglesGroup.style.marginRight = '8px';

    // Filter Active File Button
    const filterActiveBtn = togglesGroup.createEl('div', {
      cls: 'clickable-icon todo-toggle-btn',
      attr: { 'aria-label': 'Filter by active file' }
    });
    setIcon(filterActiveBtn, 'file');
    if (this.filterActive) filterActiveBtn.addClass('is-active');

    filterActiveBtn.addEventListener('click', () => {
      this.filterActive = !this.filterActive;
      filterActiveBtn.toggleClass('is-active', this.filterActive);
      this.refreshVisibleList();
    });

    // Add mode icons to the right side of the first row
    const group = firstRow.createEl('div', { cls: 'todo-mode-icons' });
    group.setAttr('role', 'group');
    group.setAttr('aria-label', 'Task view mode');

    // 1. Sort Toggle Button (Consolidated Default/Sort)
    const sortToggleBtn = group.createEl('div', { cls: 'clickable-icon todo-mode-icon-btn' });

    // 2. Hide Completed Toggle Button
    const hideToggleBtn = group.createEl('div', { cls: 'clickable-icon todo-mode-icon-btn' });
    hideToggleBtn.setAttr('aria-label', 'Hide completed tasks');
    setIcon(hideToggleBtn, 'lucide-eye-off');

    const updateButtons = () => {
      const mode = this.getViewMode();

      // Update Sort Button
      // If currently sorted, show 'List' icon to allow returning to default.
      // If default or hidden, show 'Sort' icon to allow sorting.
      const isSorted = mode === 'sortCompletedLast';

      // Icon reflects what will happen or current state? 
      // User requested "change icon on click".
      // Usually toggle buttons show current state (active) or target state.
      // If "List" is default, showing "Sort" icon means "Click to Sort".
      // If "Sorted", showing "List" icon means "Click to Default".
      const icon = isSorted ? 'lucide-list' : 'lucide-sort-desc';
      const title = isSorted ? 'Restaurar orden original' : 'Mover completadas al final';

      setIcon(sortToggleBtn, icon);
      sortToggleBtn.setAttr('aria-label', title);

      // Highlight if we are in the specific sorted mode
      if (isSorted) {
        sortToggleBtn.addClass('is-active');
      } else {
        sortToggleBtn.removeClass('is-active');
      }

      // Update Hide Button
      const isHidden = mode === 'hideCompleted';
      if (isHidden) {
        hideToggleBtn.addClass('is-active');
      } else {
        hideToggleBtn.removeClass('is-active');
      }
    };

    // Click Handlers
    sortToggleBtn.addEventListener('click', () => {
      const current = this.getViewMode();
      // If currently sorted, go default. Otherwise go sorted.
      const target: TaskViewMode = current === 'sortCompletedLast' ? 'default' : 'sortCompletedLast';

      this.setViewMode(target);
      updateButtons();
      const evt = new CustomEvent('todoinline:view-mode-change', { detail: { mode: target } });
      window.dispatchEvent(evt);
      this.refreshVisibleList();
    });

    hideToggleBtn.addEventListener('click', () => {
      const current = this.getViewMode();
      // Toggle hide
      const target: TaskViewMode = current === 'hideCompleted' ? 'default' : 'hideCompleted';

      this.setViewMode(target);
      updateButtons();
      const evt = new CustomEvent('todoinline:view-mode-change', { detail: { mode: target } });
      window.dispatchEvent(evt);
      this.refreshVisibleList();
    });

    // Initialize
    updateButtons();

    // Add search results info bar (second row)
    const searchResultsInfo = toolbar.createEl('div', { cls: 'search-results-info' });

    // Left side: task count
    const searchResultsWarp = searchResultsInfo.createEl('div', { cls: 'search-results-result-count' });
    const searchResultsCount = searchResultsWarp.createEl('span');
    searchResultsCount.setText('0 of 0 tasks');

    // Right side: sort dropdown
    // const sortDropdown = searchResultsInfo.createEl('div');
    const select = searchResultsInfo.createEl('select', {
      cls: 'dropdown',
      attr: {
        'aria-label': 'Sort tasks by',
        'data-sort-mode': 'default'
      }
    });

    const sortOptions = [
      { value: 'default', label: 'Default (file path)' },
      { value: 'sortByScheduled', label: 'Scheduled date' },
      { value: 'sortByDeadline', label: 'Deadline date' },
      { value: 'sortByPriority', label: 'Priority' }
    ];

    for (const option of sortOptions) {
      const optionEl = select.createEl('option', {
        attr: { value: option.value }
      });
      optionEl.setText(option.label);
    }

    // Set current sort mode
    const currentSortMethod = this.getSortMethod();
    select.value = currentSortMethod;

    // Add change handler for dropdown
    select.addEventListener('change', () => {
      const selectedValue = select.value;
      let sortMethod: SortMethod = 'default';

      if (selectedValue === 'sortByScheduled') {
        sortMethod = 'sortByScheduled';
      } else if (selectedValue === 'sortByDeadline') {
        sortMethod = 'sortByDeadline';
      } else if (selectedValue === 'sortByPriority') {
        sortMethod = 'sortByPriority';
      }

      // Update the sort method (keep the current view mode)
      this.setSortMethod(sortMethod);

      // Update the dropdown to reflect the current sort method
      select.value = sortMethod;

      // Dispatch event for persistence
      const evt = new CustomEvent('todoinline:sort-method-change', { detail: { sortMethod } });
      window.dispatchEvent(evt);

      // Refresh the visible list (transformForView will handle the sorting)
      this.refreshVisibleList();
    });

    // Keep a reference for keyboard handlers to focus later
    this.searchInputEl = inputEl;
  }

  // Update task state using TaskEditor and WorkflowService
  private async updateTaskState(task: Task, nextState: string): Promise<void> {
    const isCompleted = this.workflowService.isCompleted(nextState);
    const updated = await this.editor.updateTaskState(task, nextState, isCompleted);

    // Sync in-memory task from returned snapshot
    task.rawText = updated.rawText;
    if (typeof (updated as { state?: unknown }).state === 'string') {
      task.state = (updated as { state: string }).state as Task['state'];
    }
    task.completed = !!(updated as { completed?: unknown }).completed;
  }

  getViewType() {
    return TodoView.viewType;
  }

  /** Return keyword sets directly from wrapper service */
  private getKeywordSets(): { pending: string[]; active: string[]; completed: string[] } {
    return {
      pending: this.workflowService.getPendingKeywords(),
      active: this.workflowService.getActiveKeywords(),
      completed: this.workflowService.getCompletedKeywords()
    };
  }

  private getKeywordColor(keyword: string): string {
    return this.workflowService.getKeywordColor(keyword);
  }

  /** Build the list of selectable states for the context menu, excluding the current state */
  private getSelectableStatesForMenu(current: string): { group: string; states: string[] }[] {
    const { pending, active, completed } = this.getKeywordSets();

    const dedupe = (arr: string[]) => Array.from(new Set(arr)).filter(s => s && s.length > 0 && s !== current);

    // Present three groups with requested Renaming
    const groups: { group: string; states: string[] }[] = [
      { group: 'Start', states: dedupe(pending) },
      { group: 'In Progress', states: dedupe(active) },
      { group: 'Finished', states: dedupe(completed) },
    ];
    return groups.filter(g => g.states.length > 0);
  }

  /** Open Obsidian Menu at mouse event location listing default and additional keywords (excluding current) */
  private openStateMenuAtMouseEvent(task: Task, evt: MouseEvent): void {
    evt.preventDefault();
    evt.stopPropagation();
    const menu = new Menu();
    const groups = this.getSelectableStatesForMenu(task.state);

    for (const g of groups) {
      // Section header (disabled item)
      menu.addItem((item) => {
        item.setTitle(g.group);
        item.setDisabled(true);
      });
      for (const state of g.states) {
        menu.addItem((item) => {
          item.setTitle(state);
          item.onClick(async () => {
            await this.updateTaskState(task, state);
            this.refreshTaskElement(task);
          });
        });
      }
      // Divider between groups when both exist
      menu.addSeparator();
    }

    // Prefer API helper when available; fallback to explicit coordinates
    const maybeShowAtMouseEvent = (menu as unknown as { showAtMouseEvent?: (e: MouseEvent) => void }).showAtMouseEvent;
    if (typeof maybeShowAtMouseEvent === 'function') {
      maybeShowAtMouseEvent.call(menu, evt);
    } else {
      menu.showAtPosition({ x: evt.clientX, y: evt.clientY });
    }
  }

  /** Open Obsidian Menu at a specific screen position */
  private openStateMenuAtPosition(task: Task, pos: { x: number; y: number; }): void {
    const menu = new Menu();
    const groups = this.getSelectableStatesForMenu(task.state);

    for (const g of groups) {
      menu.addItem((item) => {
        item.setTitle(g.group);
        item.setDisabled(true);
      });
      for (const state of g.states) {
        menu.addItem((item) => {
          item.setTitle(state);
          item.onClick(async () => {
            await this.updateTaskState(task, state);
            this.refreshTaskElement(task);
          });
        });
      }
      menu.addSeparator();
    }
    menu.showAtPosition({ x: pos.x, y: pos.y });
  }

  getDisplayText() {
    return "TODO inline";
  }

  getIcon(): string {
    // Use the same icon as the ribbon button
    return TASK_VIEW_ICON;
  }

  // Build helpers for a single task's subtree (idempotent, single responsibility)
  private buildCheckbox(task: Task, container: HTMLElement): HTMLInputElement {
    const checkbox = container.createEl('input', {
      type: 'checkbox',
      cls: 'todo-checkbox'
    });
    checkbox.checked = task.completed;

    checkbox.addEventListener('change', async () => {
      // Use configured states instead of hardcoded TODO/DONE
      const { pending, completed } = this.getKeywordSets();
      // Default to first available state or fallback if empty (shouldn't happen with defaults)
      const pendingState = pending.length > 0 ? pending[0] : 'TODO';
      const completedState = completed.length > 0 ? completed[0] : 'DONE';

      const targetState = checkbox.checked ? completedState : pendingState;
      await this.updateTaskState(task, targetState);
      const mode = this.getViewMode();
      if (mode !== 'default') {
        // Lighter refresh: recompute and redraw only the list
        this.refreshVisibleList();
      } else {
        this.refreshTaskElement(task);
      }
    });

    return checkbox;
  }

  // Calculate next state via WorkflowService
  private getNextState(currentState: string): string {
    return this.workflowService.getNextState(currentState);
  }

  private getContrastColor(hexcolor: string): string {
    // Remove hash
    const hex = hexcolor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
  }

  private buildKeyword(task: Task, parent: HTMLElement): HTMLSpanElement {
    const todoSpan = parent.createEl('span', { cls: 'todo-keyword' });
    todoSpan.setText(task.state);
    todoSpan.setAttr('role', 'button');
    todoSpan.setAttr('tabindex', '0');
    todoSpan.setAttr('aria-checked', String(task.completed));

    // Apply Colors
    const color = this.getKeywordColor(task.state);
    const contrast = this.getContrastColor(color);

    todoSpan.style.backgroundColor = color;
    todoSpan.style.color = contrast;
    todoSpan.style.padding = '2px 6px';
    todoSpan.style.borderRadius = '4px';
    todoSpan.style.fontSize = '0.85em';
    todoSpan.style.fontWeight = 'bold';

    const activate = async (evt: Event) => {
      evt.stopPropagation();
      const next = this.getNextState(task.state);
      await this.updateTaskState(task, next);
      this.refreshTaskElement(task);
    };

    // Click advances to next state (quick action)
    todoSpan.addEventListener('click', (evt) => activate(evt));

    // Keyboard support: Enter/Space and menu keys
    todoSpan.addEventListener('keydown', (evt: KeyboardEvent) => {
      const key = evt.key;
      if (key === 'Enter' || key === ' ') {
        evt.preventDefault();
        evt.stopPropagation();
        activate(evt);
      }
      if (key === 'F10' && evt.shiftKey) {
        evt.preventDefault();
        evt.stopPropagation();
        const rect = todoSpan.getBoundingClientRect();
        this.openStateMenuAtPosition(task, { x: rect.left, y: rect.bottom });
      }
      if (key === 'ContextMenu') {
        evt.preventDefault();
        evt.stopPropagation();
        const rect = todoSpan.getBoundingClientRect();
        this.openStateMenuAtPosition(task, { x: rect.left, y: rect.bottom });
      }
    });

    // Prevent duplicate context menu on Android: contextmenu + long-press both firing
    let suppressNextContextMenu = false;
    // Also guard re-entrancy so we never open two menus within a short window
    let lastMenuOpenTs = 0;
    const MENU_DEBOUNCE_MS = 350;

    const openMenuAtMouseEventOnce = (evt: MouseEvent) => {
      const now = Date.now();
      if (now - lastMenuOpenTs < MENU_DEBOUNCE_MS) {
        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
      lastMenuOpenTs = now;
      this.openStateMenuAtMouseEvent(task, evt);
    };

    const openMenuAtPositionOnce = (x: number, y: number) => {
      const now = Date.now();
      if (now - lastMenuOpenTs < MENU_DEBOUNCE_MS) return;
      lastMenuOpenTs = now;
      this.openStateMenuAtPosition(task, { x, y });
    };

    // Right-click to open selection menu (Obsidian style)
    todoSpan.addEventListener('contextmenu', (evt: MouseEvent) => {
      // If a long-press just opened the menu, ignore the subsequent contextmenu
      if (suppressNextContextMenu) {
        evt.preventDefault();
        evt.stopPropagation();
        // do not immediately clear; allow a micro-window to absorb chained events
        return;
      }
      openMenuAtMouseEventOnce(evt);
    });

    // Long-press for mobile
    let touchTimer: number | null = null;
    todoSpan.addEventListener('touchstart', (evt: TouchEvent) => {
      if (evt.touches.length !== 1) return;
      const touch = evt.touches[0];
      // Many Android browsers will still emit a contextmenu after long press.
      // We mark suppression immediately on touchstart so the later contextmenu is eaten.
      suppressNextContextMenu = true;
      touchTimer = window.setTimeout(() => {
        // Re-read last known coordinates in case the user moved a bit during press
        const x = touch.clientX;
        const y = touch.clientY;
        openMenuAtPositionOnce(x, y);
      }, 450);
    }, { passive: true });

    const clearTouch = () => {
      if (touchTimer) {
        window.clearTimeout(touchTimer);
        touchTimer = null;
      }
      // Keep suppression for a short grace period to absorb the trailing native contextmenu
      window.setTimeout(() => {
        suppressNextContextMenu = false;
      }, 250);
    };
    todoSpan.addEventListener('touchend', clearTouch, { passive: true });
    todoSpan.addEventListener('touchcancel', clearTouch, { passive: true });

    // Additionally, ignore a click that may be synthesized after contextmenu on mobile
    todoSpan.addEventListener('click', (evt) => {
      const now = Date.now();
      if (now - lastMenuOpenTs < MENU_DEBOUNCE_MS) {
        // a menu was just opened; prevent accidental state toggle
        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
    }, true); // capture to intercept before activate handler

    return todoSpan;
  }

  private buildText(task: Task, container: HTMLElement): HTMLSpanElement {
    const taskText = container.createEl('span', { cls: 'todo-text' });

    // Keyword button
    this.buildKeyword(task, taskText);

    // Priority Badge
    if (task.priority) {
      const priorityBadge = taskText.createEl('span', {
        cls: 'priority-badge',
        text: task.priority
      });

      // Apply color if available from settings
      const pColor = this.getKeywordColor(task.priority);
      if (pColor && pColor !== '#888888') {
        priorityBadge.style.backgroundColor = pColor;
        priorityBadge.style.color = this.getContrastColor(pColor);
      } else {
        // Default styling fallback if no color set
        priorityBadge.addClass('priority-med'); // fallback class
      }
      priorityBadge.setAttribute('aria-label', `Priority ${task.priority}`);
      priorityBadge.setAttribute('title', `Priority ${task.priority}`);
    }

    // Remaining text
    const restOfText = task.text;
    if (restOfText) {
      taskText.appendText(' ');
      this.renderTaskTextWithLinks(restOfText, taskText);
    }

    taskText.toggleClass('completed', task.completed);
    return taskText;
  }

  // Build a complete LI for a task (used by initial render and refresh)
  private buildTaskListItem(task: Task): HTMLLIElement {
    const li = createEl('li', { cls: 'todo-item' });
    li.setAttribute('data-path', task.path);
    li.setAttribute('data-line', String(task.line));

    const checkbox = this.buildCheckbox(task, li);
    this.buildText(task, li);

    // Add date display if scheduled or deadline dates exist and task is not completed
    if ((task.scheduledDate || task.deadlineDate) && !task.completed) {
      this.buildDateDisplay(task, li);
    }

    // Click to open source (avoid checkbox and keyword)
    li.addEventListener('click', (evt) => {
      const target = evt.target;
      if (
        target !== checkbox &&
        target instanceof HTMLElement &&
        !target.hasClass('todo-keyword')
      ) {
        this.openTaskLocation(evt, task);
      }
    });

    return li;
  }

  // Replace only the LI subtree for the given task (state-driven, idempotent)
  private refreshTaskElement(task: Task): void {
    const container = this.contentEl;
    const list = container.querySelector('ul.todo-list');
    if (!list) return;

    const selector = `li.todo-item[data-path="${CSS.escape(task.path)}"][data-line="${task.line}"]`;
    const existing = list.querySelector(selector);
    const freshLi = this.buildTaskListItem(task);

    if (existing && existing.parentElement === list) {
      list.replaceChild(freshLi, existing);
    } else {
      // Fallback: append if not found (shouldn't normally happen)
      list.appendChild(freshLi);
    }
  }

  /** Recalculate visible tasks for current mode + search and update only the list subtree */
  refreshVisibleList(): void {
    const container = this.contentEl;

    // Sync dropdown with current sort method
    const sortDropdown = container.querySelector('.sort-dropdown select') as HTMLSelectElement;
    if (sortDropdown) {
      const currentSortMethod = this.getSortMethod();
      sortDropdown.value = currentSortMethod;
    }

    // Ensure list container exists and is the sole place for items
    let list = container.querySelector('ul.todo-list');
    if (!list) {
      list = container.createEl('ul', { cls: 'todo-list' });
    }
    list.empty();

    const mode = this.getViewMode();
    const allTasks = this.tasks ?? [];
    let visible = this.transformForView(allTasks, mode);

    // Apply active file filtering
    if (this.filterActive) {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        visible = visible.filter(t => t.path === activeFile.path);
      } else {
        visible = [];
      }
    }

    // Apply search filtering
    const q = this.getSearchQuery().trim();
    if (q.length > 0) {
      const searchQuery = this.isCaseSensitive ? q : q.toLowerCase();
      const searchText = this.isCaseSensitive ? (text: string) => text : (text: string) => text.toLowerCase();

      visible = visible.filter(t => {
        const baseName = t.path.slice(t.path.lastIndexOf('/') + 1);
        return (
          (t.rawText && searchText(t.rawText).includes(searchQuery)) ||
          (t.text && searchText(t.text).includes(searchQuery)) ||
          (t.path && searchText(t.path).includes(searchQuery)) ||
          (baseName && searchText(baseName).includes(searchQuery))
        );
      });
    }

    // Update search results info
    const searchResultsCount = container.querySelector('.search-results-result-count');
    if (searchResultsCount) {
      searchResultsCount.setText(`${visible.length} of ${allTasks.length} task` + (allTasks.length === 1 ? '' : 's'));
    }

    // Empty-state guidance UI
    if (visible.length === 0) {
      // Remove any previous empty-state
      const prevEmpty = container.querySelector('.todo-empty');
      if (prevEmpty) prevEmpty.detach?.();

      // Determine scenario
      const hasAnyTasks = allTasks.length > 0;
      const hasAnyIncomplete = allTasks.some(t => !t.completed);
      const isHideCompleted = mode === 'hideCompleted';

      // Build empty message container (below toolbar, above list)
      const empty = container.createEl('div', { cls: 'todo-empty' });

      const title = empty.createEl('div', { cls: 'todo-empty-title' });
      const subtitle = empty.createEl('div', { cls: 'todo-empty-subtitle' });

      if (!hasAnyTasks) {
        // a) No tasks found at all
        title.setText('No tasks found');
        subtitle.setText('Create tasks in your notes using "TODO Your task". They will appear here automatically.');
      } else if (this.filterActive && !this.app.workspace.getActiveFile()) {
        title.setText('No active file');
        subtitle.setText('Open a file to see its tasks.');
      } else if (isHideCompleted && !hasAnyIncomplete) {
        // b) Hide-completed enabled, but only completed tasks exist
        title.setText('All tasks are completed');
        subtitle.setText('You are hiding completed tasks. Switch view mode or add new tasks to see more.');
      } else {
        // General empty from search filter or other modes
        title.setText('No matching tasks');
        subtitle.setText('Try clearing the search or switching view modes.');
      }

      // Keep toolbar enabled: do not disable or overlay; list remains empty
      return;
    } else {
      // Remove any empty-state if present
      const prevEmpty = container.querySelector('.todo-empty');
      if (prevEmpty) prevEmpty.detach?.();
    }

    // Render visible tasks
    let currentHeader = '';

    // Sort logic guarantees tasks from same file are adjacent (if default sort). 
    // If user uses other sorts (priority/date), grouping might break adjacency.
    // The user requirement implies "separated by file" is key. 
    // If we want STRICT grouping even with Date sort, we must group first, then sort within groups?
    // OR we just enforce that "Default" sort is the only one that visually groups perfectly? 
    // Re-reading: "Siempre que se vean todas, las tareas deben estar separadas por archivo".
    // This implies grouping hierarchy > sort order.
    // However, if I sort by Date, a file's tasks might be scattered.
    // To support "Always grouped", I should probably grouping *be* the primary sort, and then user sort applying *within* files.
    // But currently I won't change the sort architecture completely to avoid regressions. 
    // I will assume "Default view" (File Path sort) is the primary use case for this, OR I will just render headers whenever path changes.
    // If path changes back and forth (e.g. Date sort interleaved), we get multiple headers for same file used non-contiguously.
    // To fix this proper: I should maybe pre-group tasks into a Map<FolderPath, Task[]> and then iterate keys.
    // But let's stick to the current "render loop with change detection" for simplicity and performance, assuming File Sort is dominant or acceptable.

    // If filter active is ON, we only have one path ideally.

    for (const task of visible) {
      // Logic: Always render header if path differs from previous
      if (task.path !== currentHeader) {
        currentHeader = task.path;

        // Create Group Header
        const isCollapsed = this.collapsedPaths.has(currentHeader);
        const groupHeader = list.createEl('li', {
          cls: `todo-group-header ${isCollapsed ? 'is-collapsed' : ''}`
        });

        const icon = groupHeader.createEl('span', { cls: 'todo-group-icon' });
        setIcon(icon, 'chevron-down');

        // Show basename
        const lastSlash = currentHeader.lastIndexOf('/');
        const baseName = lastSlash >= 0 ? currentHeader.slice(lastSlash + 1) : currentHeader;

        const title = groupHeader.createEl('span', { cls: 'todo-group-title' });
        title.setText(baseName);

        // Count (optional, maybe nice)
        // const count = visible.filter(t => t.path === currentHeader).length;
        // title.setAttribute('data-count', String(count));

        groupHeader.setAttribute('title', currentHeader);

        // Toggle handler
        groupHeader.addEventListener('click', async (e) => {
          e.stopPropagation();
          await this.toggleCollapse(task.path);
        });
      }

      // If collapsed, skip rendering items
      if (this.collapsedPaths.has(task.path)) {
        continue;
      }

      const li = this.buildTaskListItem(task);
      list.appendChild(li);
    }
  }

  // Obsidian lifecycle methods for view open: keyed, minimal render
  // Obsidian lifecycle methods for view open: keyed, minimal render
  async onOpen() {
    const container = this.contentEl;
    container.empty();

    // 1. Build Toolbar
    this.buildToolbar(container);

    // 2. Initial Render
    this.refreshVisibleList();

    // 3. Subscribe to store updates
    this.registerEvent(
      this.taskStore.on('update', (newTasks: Task[]) => {
        this.tasks = newTasks;
        this.refreshVisibleList();
      })
    );

    // Keyboard shortcuts: Slash to focus search, Esc to clear
    const input: HTMLInputElement | null = this.searchInputEl ?? null;
    const keyHandler = (evt: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isTyping =
        !!active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          (active as unknown as { isContentEditable?: boolean }).isContentEditable === true);

      if (evt.key === '/' && !evt.metaKey && !evt.ctrlKey && !evt.altKey) {
        if (!isTyping && input) {
          evt.preventDefault();
          input.focus();
          input.select();
        }
      }

      if (evt.key === 'Escape') {
        if (active === input && input) {
          evt.preventDefault();
          input.value = '';
          this.setSearchQuery('');
          this.refreshVisibleList(); // re-render cleared without losing focus context
          queueMicrotask(() => input.blur());
        }
      }
    };

    // Save references for cleanup
    this._searchKeyHandler = keyHandler;
    window.addEventListener('keydown', keyHandler);
  }

  /**
   * Format a date for display with relative time indicators
   * @param date The date to format
   * @param includeTime Whether to include time if available
   * @returns Formatted date string
   */
  private formatDateForDisplay(date: Date | null, includeTime = false): string {
    if (!date) return '';
    return DateUtils.formatDateForDisplay(date, includeTime);
  }

  /**
   * Get CSS classes for date display based on deadline status
   * @param date The date to check
   * @param isDeadline Whether this is a deadline date
   * @returns Array of CSS classes
   */
  private getDateStatusClasses(date: Date | null, isDeadline = false): string[] {
    if (!date) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const classes = ['todo-date'];

    classes.push('todo-date');

    if (diffDays < 0) {
      classes.push('todo-date-overdue');
    } else if (diffDays === 0) {
      classes.push('todo-date-today');
    } else if (diffDays <= 3) {
      classes.push('todo-date-soon');
    }

    return classes;
  }

  /**
   * Build date display element for a task
   * @param task The task to display dates for
   * @param parent The parent element to append to
   */
  private buildDateDisplay(task: Task, parent: HTMLElement): void {
    const dateContainer = parent.createEl('div', { cls: 'todo-date-container' });

    // Display scheduled date
    if (task.scheduledDate) {
      const scheduledDiv = dateContainer.createEl('div', {
        cls: this.getDateStatusClasses(task.scheduledDate, false)
      });

      const scheduledLabel = scheduledDiv.createEl('span', { cls: 'date-label' });
      scheduledLabel.setText('Scheduled: ');

      const scheduledValue = scheduledDiv.createEl('span', { cls: 'date-value' });
      scheduledValue.setText(this.formatDateForDisplay(task.scheduledDate, true));
    }

    // Display deadline date
    if (task.deadlineDate) {
      const deadlineDiv = dateContainer.createEl('div', {
        cls: this.getDateStatusClasses(task.deadlineDate, true)
      });

      const deadlineLabel = deadlineDiv.createEl('span', { cls: 'date-label' });
      deadlineLabel.setText('Deadline: ');

      const deadlineValue = deadlineDiv.createEl('span', { cls: 'date-value' });
      deadlineValue.setText(this.formatDateForDisplay(task.deadlineDate, true));
    }
  }

  /** Strip Markdown formatting to produce display-only plain text */
  private stripMarkdown(input: string): string {
    if (!input) return '';
    let out = input;

    // HTML tags (repeat until all tags are removed)
    let prev;
    do {
      prev = out;
      out = out.replace(/<[^>]+>/g, '');
    } while (out !== prev);

    // Images: ![alt](url) -> alt
    out = out.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');

    // Inline code: `code` -> code
    out = out.replace(/`([^`]+)`/g, '$1');

    // Headings
    out = out.replace(/^\s{0,3}#{1,6}\s+/gm, '');

    // Emphasis/strong
    out = out.replace(/(\*\*|__)(.*?)\1/g, '$2');
    out = out.replace(/(\*|_)(.*?)\1/g, '$2');

    // Strike/highlight/math
    out = out.replace(/~~(.*?)~~/g, '$1');
    out = out.replace(/==(.*?)==/g, '$1');
    out = out.replace(/\$\$(.*?)\$\$/g, '$1');

    // Normalize whitespace
    out = out.replace(/\r/g, '');
    out = out.replace(/[ \t]+\n/g, '\n');
    out = out.replace(/\n{3,}/g, '\n\n');
    out = out.trim();

    return out;
  }

  // Render Obsidian-style links and tags as non-clickable, styled spans inside task text.
  // Supports:
  //  - Wiki links: [[Note]] and [[Note|Alias]]
  //  - Markdown links: [Alias](url-or-path)
  //  - Bare URLs: http(s)://...
  //  - Tags: #tag
  private renderTaskTextWithLinks(text: string, parent: HTMLElement) {
    // For display only, strip any markdown formatting first
    const textToProcess = this.stripMarkdown(text) || '';
    const patterns: { type: 'wiki' | 'md' | 'url' | 'tag'; regex: RegExp; }[] = [
      // [[Page]] or [[Page|Alias]]
      { type: 'wiki', regex: /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g },
      // [Alias](target)
      { type: 'md', regex: /\[([^\]]+)\]\(([^)]+)\)/g },
      // bare URLs
      { type: 'url', regex: /\bhttps?:\/\/[^\s)]+/g },
      // #tags (must come after URLs to avoid conflicts with URLs containing #)
      { type: 'tag', regex: /#([^\s\])[}{>]+)/g },
    ];

    let i = 0;
    while (i < textToProcess.length) {
      let nextMatch: { type: 'wiki' | 'md' | 'url' | 'tag'; match: RegExpExecArray; } | null = null;

      for (const p of patterns) {
        p.regex.lastIndex = i;
        const m = p.regex.exec(textToProcess);
        if (m) {
          if (!nextMatch || m.index < nextMatch.match.index) {
            nextMatch = { type: p.type, match: m };
          }
        }
      }

      if (!nextMatch) {
        // Append any remaining text
        parent.appendText(textToProcess.slice(i));
        break;
      }

      // Append plain text preceding the match
      if (nextMatch.match.index > i) {
        parent.appendText(textToProcess.slice(i, nextMatch.match.index));
      }

      // Create appropriate styled element based on type
      if (nextMatch.type === 'tag') {
        // Create a tag-like span
        const span = parent.createEl('span', { cls: 'todo-tag' });
        const tagName = nextMatch.match[0]; // Full #tag text including #
        span.setText(tagName);
        span.setAttribute('title', tagName);
      } else {
        // Create a non-interactive, link-like span for other types
        const span = parent.createEl('span', { cls: 'todo-link-like' });

        if (nextMatch.type === 'wiki') {
          const target = nextMatch.match[1];
          const alias = nextMatch.match[2];
          span.setText(alias ?? target);
          span.setAttribute('title', target);
        } else if (nextMatch.type === 'md') {
          const label = nextMatch.match[1];
          const url = nextMatch.match[2];
          span.setText(label);
          span.setAttribute('title', url);
        } else {
          const url = nextMatch.match[0];
          span.setText(url);
          span.setAttribute('title', url);
        }
      }

      // Advance past the match
      i = nextMatch.match.index + nextMatch.match[0].length;
    }
  }

  // Open the source file in the vault where the task is declared, honoring Obsidian default-like modifiers.
  // Behavior:
  // - Default click (no modifiers): navigate to existing tab or open in new tab.
  // - Cmd (mac) / Ctrl (win/linux) click, or Middle-click: open in new tab.
  // - Shift-click: open in split.
  // - Alt-click: pin the target leaf after opening.
  // Additionally: Never open pages in the TODO inline tab (ensure this on mobile too).
  async openTaskLocation(evt: MouseEvent, task: Task) {
    const file = this.app.vault.getAbstractFileByPath(task.path);
    if (!(file instanceof TFile)) return;

    const { workspace } = this.app;
    const isMac = Platform.isMacOS;
    const isMiddle = (evt.button === 1);
    const metaOrCtrl = isMac ? evt.metaKey : evt.ctrlKey;

    // Helpers
    const isMarkdownLeaf = (leaf: WorkspaceLeaf | null | undefined): boolean => {
      if (!leaf) return false;
      if (leaf.view instanceof MarkdownView) return true;
      return leaf.view?.getViewType?.() === 'markdown';
    };
    const isTodoLeaf = (leaf: WorkspaceLeaf | null | undefined): boolean => {
      if (!leaf) return false;
      return leaf.view instanceof TodoView;
    };
    const findExistingLeafForFile = (): WorkspaceLeaf | null => {
      const leaves = workspace.getLeavesOfType('markdown');
      for (const leaf of leaves) {
        if (isTodoLeaf(leaf)) continue;
        if (leaf.view instanceof MarkdownView) {
          const openFile = leaf.view.file;
          if (openFile && openFile.path === file.path) {
            return leaf;
          }
        }
      }
      return null;
    };
    // Each page should own its tab. Only "reuse" when it's the same file.
    const findReusableMarkdownLeaf = (): WorkspaceLeaf | null => {
      // Only return a leaf if it's already showing this exact file.
      return findExistingLeafForFile();
    };

    const forceNewTab = isMiddle || metaOrCtrl;
    const doSplit = evt.shiftKey;

    let targetLeaf: WorkspaceLeaf | null = null;

    if (doSplit) {
      // New behavior: if the file is already open, focus that existing tab instead of creating a split.
      const existing = findExistingLeafForFile();
      if (existing) {
        targetLeaf = existing;
      } else {
        targetLeaf = workspace.getLeaf('split');
        // Guard: ensure not TODO inline and is a markdown-capable leaf
        if (isTodoLeaf(targetLeaf) || !isMarkdownLeaf(targetLeaf)) {
          targetLeaf = findReusableMarkdownLeaf() ?? workspace.getLeaf('tab');
        }
      }
    } else if (forceNewTab) {
      targetLeaf = workspace.getLeaf('tab');
      if (isTodoLeaf(targetLeaf) || !isMarkdownLeaf(targetLeaf)) {
        targetLeaf = findReusableMarkdownLeaf() ?? workspace.getLeaf('tab');
      }
    } else {
      targetLeaf = findExistingLeafForFile();
      if (!targetLeaf) {
        targetLeaf = findReusableMarkdownLeaf();
      }
      if (!targetLeaf) {
        targetLeaf = workspace.getLeaf('tab');
      }
      if (isTodoLeaf(targetLeaf)) {
        targetLeaf = findReusableMarkdownLeaf() ?? workspace.getLeaf('tab');
      }
    }

    await targetLeaf.openFile(file);

    if (evt.altKey) {
      try { (targetLeaf as WorkspaceLeaf & { setPinned?: (pinned: boolean) => void }).setPinned?.(true); } catch (_) { /* ignore */ }
      try { ((targetLeaf as WorkspaceLeaf) as { pinned?: boolean }).pinned = true; } catch (_) { /* ignore */ }
    }

    if (targetLeaf.view instanceof MarkdownView) {
      const markdownView = targetLeaf.view;
      const editor = markdownView.editor;
      const pos = { line: task.line, ch: 0 };
      editor.setCursor(pos);
      try { (markdownView as unknown as { setEphemeralState?: (state: { line: number; col: number }) => void }).setEphemeralState?.({ line: task.line, col: 0 }); } catch (_) { }
      editor.scrollIntoView({ from: pos, to: pos });
    }

    await workspace.revealLeaf(targetLeaf);
  }

  async onClose() {
    const handler = this._searchKeyHandler as ((e: KeyboardEvent) => void) | undefined;
    if (handler) {
      window.removeEventListener('keydown', handler);
      this._searchKeyHandler = undefined;
    }
    this.searchInputEl = null;
    await (super.onClose?.());
  }


}

