import { Plugin, TFile, TAbstractFile, WorkspaceLeaf } from 'obsidian';
import { Task, TaskViewMode } from './task';
import { TodoView, TASK_VIEW_ICON } from "./view/task-view";
import { TodoTrackerSettingTab } from "./settings/settings";
import { TodoTrackerSettings, DEFAULT_SETTINGS } from "./settings/defaults";
import { keywordHighlighter } from './editor/keyword-highlighter';
import { WorkflowService } from './services/workflow-service';
import { TaskStore } from './services/task-store';

export default class TodoInlinePlugin extends Plugin {
  settings: TodoTrackerSettings;

  // Services
  private workflowService: WorkflowService;
  public taskStore: TaskStore;

  // Obsidian lifecycle method called when the plugin is loaded.
  async onload() {
    await this.loadSettings();
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
      const activeLeaf = workspace.activeLeaf;
      if (activeLeaf !== leaf) {
        await workspace.revealLeaf(leaf);
      }
    } else {
      leaf = workspace.getLeaf(true);
      await leaf.setViewState({ type: TodoView.viewType, active: true });
      const activeLeaf = workspace.activeLeaf;
      if (activeLeaf !== leaf) {
        await workspace.revealLeaf(leaf);
      }
    }
  }
}
