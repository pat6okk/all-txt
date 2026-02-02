import { Plugin, TFile, TAbstractFile, WorkspaceLeaf, Editor } from 'obsidian';
import { Task, TaskViewMode } from './task';
import { TodoView, TASK_VIEW_ICON } from "./view/task-view";
import { TodoTrackerSettingTab } from "./settings/settings";
import { TodoTrackerSettings, DEFAULT_SETTINGS } from "./settings/defaults";
import { keywordHighlighter } from './editor/keyword-highlighter';
import { WorkflowService } from './services/workflow-service';
import { TaskStore } from './services/task-store';
import { SettingsService } from './services/settings-service';

export default class TodoInlinePlugin extends Plugin {
  settings: TodoTrackerSettings;

  // Services
  private workflowService: WorkflowService;
  public taskStore: TaskStore;
  public settingsService: SettingsService;

  // Obsidian lifecycle method called when the plugin is loaded.
  async onload() {
    await this.loadSettings();
    this.settingsService = new SettingsService(this);
    this.workflowService = new WorkflowService(this.settings);
    this.taskStore = new TaskStore(this.app, this.settings);

    // Register the custom view type
    this.registerView(
      TodoView.viewType,
      (leaf) => new TodoView(
        leaf,
        this.taskStore,
        this.settings.taskViewMode,
        this.workflowService,
        () => this.saveSettings()
      )
    );

    // Persist view-mode changes coming from TodoView toolbars
    const handler = async (e: Event) => {
      const detail = (e as CustomEvent).detail as { mode: TaskViewMode };
      if (!detail?.mode) return;
      this.settings.taskViewMode = detail.mode;
      await this.saveSettings();
      // View will auto-update or we can trigger store if needed, 
      // but view mode is local to view usually. 
      // TodoView.refreshVisibleList() handles this.
      // We might need to notify views to re-read settings if they obey them.
      this.refreshOpenTaskViews();
    };
    window.addEventListener('todoinline:view-mode-change', handler);
    this.register(() => window.removeEventListener('todoinline:view-mode-change', handler));

    this.addRibbonIcon(TASK_VIEW_ICON, 'Open TODO inline', () => {
      this.showTasks();
    });

    // Add settings tab
    this.addSettingTab(new TodoTrackerSettingTab(this.app, this));

    // Register editor extension for keyword highlighting
    this.registerEditorExtension(keywordHighlighter(() => this.settings));

    // Add command to show tasks
    this.addCommand({
      id: 'show-todo-tasks',
      name: 'Show TODO tasks',
      callback: () => this.showTasks()
    });

    // Initial scan
    await this.taskStore.scanVault();

    // Register file change events -> Delegate to TaskStore
    this.registerEvent(
      this.app.vault.on('modify', (file) => this.taskStore.handleFileChange(file))
    );
    this.registerEvent(
      this.app.vault.on('delete', (file) => this.taskStore.handleFileDelete(file))
    );
    this.registerEvent(
      this.app.vault.on('create', (file) => this.taskStore.handleFileChange(file))
    );
    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => this.taskStore.handleFileRename(file, oldPath))
    );

    // US-1.5: Register Editor Context Menu for Quick Conversion
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor) => {
        const selection = editor.getSelection();
        const line = editor.getLine(editor.getCursor().line).trim();
        if (!selection && !line) return;

        // Use a single menu item that opens a submenu with all Start States
        menu.addItem((item) => {
          item
            .setTitle('Convert to FLOW block...')
            .setIcon('SheetsInCircuit')
            .setSection('action');

          // @ts-ignore - The Obsidian API supports submenus in recent versions via this pattern
          const subMenu = item.setSubmenu ? item.setSubmenu() : null;

          const keywords = this.settings.todoKeywords || ['TODO'];

          keywords.forEach((kw) => {
            if (subMenu) {
              subMenu.addItem((subItem: any) => {
                subItem
                  .setTitle(`${kw} Block`)
                  .onClick(() => this.convertSelectedToFlow(editor, kw));
              });
            } else {
              // Fallback for older API versions: add them as separate top-level items if submenu is not available
              menu.addItem((topItem) => {
                topItem
                  .setTitle(`Convert to ${kw} block`)
                  .setIcon('SheetsInCircuit')
                  .setSection('action')
                  .onClick(() => this.convertSelectedToFlow(editor, kw));
              });
            }
          });
        });
      })
    );
  }

  /**
   * US-1.5: Logic to convert selected text or current line into a FLOW block
   * Refined to preserve original structure (bullets, checkboxes)
   */
  private convertSelectedToFlow(editor: Editor, keyword: string) {
    const selection = editor.getSelection();
    const cursor = editor.getCursor();

    let textToConvert = selection ? selection : editor.getLine(cursor.line);
    let from = selection ? editor.getCursor('from') : { line: cursor.line, ch: 0 };
    let to = selection ? editor.getCursor('to') : { line: cursor.line, ch: textToConvert.length };

    // 1. Identify leading indentation of the first line
    const lines = textToConvert.split('\n');
    const firstLine = lines[0];
    const indentMatch = firstLine.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[0] : "";

    // 2. Remove the indent from the first line so we can place the keyword between it and the text
    const cleanFirstLine = firstLine.replace(/^(\s*)/, '');
    const otherLines = lines.slice(1).join('\n');
    const fullText = otherLines ? `${cleanFirstLine}\n${otherLines}` : cleanFirstLine;

    // 3. Construct the block: [INDENT][KEYWORD] [REST_OF_TEXT]
    const newBlock = `${indent}${keyword} ${fullText.trimEnd()}\n\n---`;

    editor.replaceRange(newBlock, from, to);
  }

  /**
   * Helper: refresh all open Todo views.
   * Now simpler: views subscribe to store, so we might only need this for Settings changes
   * that don't affect the store data but affect the view display (like sorting/grouping).
   */
  public async refreshOpenTaskViews(): Promise<void> {
    const leaves = this.app.workspace.getLeavesOfType(TodoView.viewType);
    for (const leaf of leaves) {
      if (leaf.view instanceof TodoView) {
        // Trigger a re-render
        // We can expose a public method on view or just let it react to data.
        // If settings changed mode, we explicitly set it.
        leaf.view.setViewMode(this.settings.taskViewMode);
        leaf.view.refreshVisibleList();
      }
    }
  }

  // Obsidian lifecycle method called when the plugin is unloaded
  onunload() {
    // interval cleared automatically
  }

  // Obsidian lifecycle method called to settings are loaded
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    // Normalize settings


    // Propagate settings to services
    if (this.workflowService) this.workflowService.updateSettings(this.settings);
    if (this.taskStore) this.taskStore.updateSettings(this.settings);
  }

  // Helper for settings tab
  public recreateParser(): void {
    if (this.taskStore) {
      this.taskStore.updateSettings(this.settings);
    }
  }

  // Obsidian lifecycle method called to save settings
  async saveSettings() {
    await this.saveData(this.settings);
    if (this.workflowService) this.workflowService.updateSettings(this.settings);
    if (this.taskStore) this.taskStore.updateSettings(this.settings);
  }

  // Show tasks in the task view
  async showTasks() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(TodoView.viewType);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      // US-2.1: Open in the right sidebar leaf by default
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        await rightLeaf.setViewState({ type: TodoView.viewType, active: true });
        leaf = rightLeaf;
      } else {
        // Fallback if no right leaf is available (unexpected)
        leaf = workspace.getLeaf(true);
        await leaf.setViewState({ type: TodoView.viewType, active: true });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
}
