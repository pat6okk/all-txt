import { Plugin, TFile, TAbstractFile, WorkspaceLeaf, Editor, Menu } from 'obsidian';
import { Task, TaskViewMode } from './task';
import { TodoView, TASK_VIEW_ICON } from "./view/task-view";
import { TodoTrackerSettingTab } from "./settings/settings";
import { TodoTrackerSettings, DEFAULT_SETTINGS } from "./settings/defaults";
import { keywordHighlighter } from './editor/keyword-highlighter';
import { keywordContextMenu } from './editor/keyword-context-menu';
import { priorityContextMenu } from './editor/priority-context-menu';
import { labelContextMenu } from './editor/label-context-menu';
import { LabelEditorSuggest } from './editor/label-editor-suggest';
import { dateContextMenu } from './editor/date-context-menu';
import { formatSelectionAsFlowBlock } from './editor/flow-block-formatter';
import { WorkflowService } from './services/workflow-service';
import { TaskEditor } from './view/task-editor';
import { TaskStore } from './services/task-store';
import { SettingsService } from './services/settings-service';
import {
  collectInlineLabels,
  dedupeLabelsCaseInsensitive,
  mergeLabelsWithDefinedOrder,
  normalizeLabelKey,
  toValidLabelDisplay,
} from './labels/label-utils';

export default class FlowTxtPlugin extends Plugin {
  settings: TodoTrackerSettings;

  // Services
  private workflowService: WorkflowService;
  public taskStore: TaskStore;
  public settingsService: SettingsService;
  private taskEditor: TaskEditor;

  // Obsidian lifecycle method called when the plugin is loaded.
  async onload() {
    await this.loadSettings();
    this.settingsService = new SettingsService(this);
    this.workflowService = new WorkflowService(this.settings);
    this.taskStore = new TaskStore(this.app, this.settings);
    this.taskEditor = new TaskEditor(this.app);

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
    window.addEventListener('flowtxt:view-mode-change', handler);
    this.register(() => window.removeEventListener('flowtxt:view-mode-change', handler));

    this.addRibbonIcon(TASK_VIEW_ICON, 'Open FLOW-txt', () => {
      this.showTasks();
    });

    // Add settings tab
    this.addSettingTab(new TodoTrackerSettingTab(this.app, this));

    // Register editor extension for keyword highlighting
    this.registerEditorExtension(keywordHighlighter(() => this.settings));

    // US-3.4: Register editor extension for keyword context menu
    this.registerEditorExtension(keywordContextMenu(this.workflowService, this.taskEditor));

    // Register editor extension for priority context menu
    this.registerEditorExtension(priorityContextMenu(this.settingsService));

    // Épica 5: Register editor extension for label context menu
    this.registerEditorExtension(labelContextMenu(this.settingsService));

    // PRJ-007: Register @label autocomplete with scoped suggestions
    this.registerEditorSuggest(
      new LabelEditorSuggest(this.app, this.settingsService, () => this.taskStore.getTasks())
    );

    // US-4.1 Phase 2: Register editor extension for date context menu
    this.registerEditorExtension(dateContextMenu(this.app, this.settingsService));

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

        // PRJ-007: Insert labels from current note (default) or full vault list
        this.addInsertLabelMenu(menu, editor);

        // Use a single menu item that opens a submenu with all Start States
        menu.addItem((item) => {
          item
            .setTitle('Convert to flow block...')
            .setIcon('SheetsInCircuit')
            .setSection('action');

          const subMenu = this.getSubmenuFromMenuItem(item);

          const workflowStarts = (this.settings.workflows || [])
            .map((workflow) => workflow[0])
            .filter((keyword): keyword is string => Boolean(keyword));
          const configuredStarts = this.settings.todoKeywords || [];
          const keywords = Array.from(new Set([...workflowStarts, ...configuredStarts]));
          const startKeywords = keywords.length > 0 ? keywords : ['TODO'];

          startKeywords.forEach((kw) => {
            if (subMenu) {
              subMenu.addItem((subItem) => {
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

  private addInsertLabelMenu(menu: Menu, editor: Editor) {
    const definedLabels = this.settingsService.getOrderedDefinedLabels();
    const noteLabels = mergeLabelsWithDefinedOrder(definedLabels, collectInlineLabels(editor.getValue()));
    const vaultLabels = mergeLabelsWithDefinedOrder(
      definedLabels,
      this.taskStore.getTasks().flatMap(task => task.labels || []),
    );

    if (noteLabels.length === 0 && vaultLabels.length === 0) {
      return;
    }

    menu.addItem((item) => {
      item
        .setTitle('Insert label...')
        .setIcon('tag')
        .setSection('action');

      let subMenu: Menu | null = null;
      subMenu = this.getSubmenuFromMenuItem(item);

      if (!subMenu) {
        noteLabels.slice(0, 10).forEach((label) => {
          menu.addItem((fallbackItem) => {
            fallbackItem
              .setTitle(`Insert @${label}`)
              .setIcon('tag')
              .setSection('action')
              .onClick(() => this.insertLabelAtCursor(editor, label));
          });
        });
        return;
      }
      const menuRef = subMenu;

      menuRef.addItem((headerItem) => {
        headerItem.setTitle('Current note labels').setDisabled(true);
      });

      if (noteLabels.length === 0) {
        menuRef.addItem((emptyItem) => {
          emptyItem.setTitle('No labels in current note').setDisabled(true);
        });
      } else {
        noteLabels.slice(0, 20).forEach((label) => {
          menuRef.addItem((labelItem) => {
            labelItem
              .setTitle(`@${label}`)
              .setIcon('tag')
              .onClick(() => this.insertLabelAtCursor(editor, label));
          });
        });
      }

      menuRef.addSeparator();
      menuRef.addItem((headerItem) => {
        headerItem.setTitle('All vault labels').setDisabled(true);
      });

      if (vaultLabels.length === 0) {
        menuRef.addItem((emptyItem) => {
          emptyItem.setTitle('No labels found in vault').setDisabled(true);
        });
      } else {
        vaultLabels.slice(0, 60).forEach((label) => {
          menuRef.addItem((labelItem) => {
            labelItem
              .setTitle(`@${label}`)
              .setIcon('tag')
              .onClick(() => this.insertLabelAtCursor(editor, label));
          });
        });
      }
    });
  }

  private insertLabelAtCursor(editor: Editor, label: string) {
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line);
    const beforeChar = cursor.ch > 0 ? line[cursor.ch - 1] : '';
    const afterChar = line[cursor.ch] || '';

    const needsLeadingSpace = beforeChar !== '' && !/\s/.test(beforeChar);
    const needsTrailingSpace = afterChar === '' || !/[\s.,;:!?)]/.test(afterChar);
    const insertion = `${needsLeadingSpace ? ' ' : ''}@${label}${needsTrailingSpace ? ' ' : ''}`;

    editor.replaceRange(insertion, cursor);
    editor.setCursor({ line: cursor.line, ch: cursor.ch + insertion.length });
  }

  private getSubmenuFromMenuItem(item: unknown): Menu | null {
    const candidate = item as { setSubmenu?: () => Menu };
    if (typeof candidate.setSubmenu === 'function') {
      return candidate.setSubmenu();
    }
    return null;
  }

  /**
   * US-1.5: Logic to convert selected text or current line into a FLOW block
   * Refined to preserve original structure (bullets, checkboxes)
   */
  private convertSelectedToFlow(editor: Editor, keyword: string) {
    const selection = editor.getSelection();
    const cursor = editor.getCursor();

    const textToConvert = selection ? selection : editor.getLine(cursor.line);
    const from = selection ? editor.getCursor('from') : { line: cursor.line, ch: 0 };
    const to = selection ? editor.getCursor('to') : { line: cursor.line, ch: textToConvert.length };

    const formattedBlock = formatSelectionAsFlowBlock(textToConvert, keyword);
    if (!formattedBlock) {
      return;
    }

    editor.replaceRange(formattedBlock, from, to);
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
    this.settings.definedLabels = dedupeLabelsCaseInsensitive(this.settings.definedLabels || []);
    const normalizedLabelColors: Record<string, string> = {};
    for (const [rawLabel, color] of Object.entries(this.settings.labelColors || {})) {
      const valid = toValidLabelDisplay(rawLabel);
      if (!valid) {
        continue;
      }
      normalizedLabelColors[normalizeLabelKey(valid)] = color;
    }
    this.settings.labelColors = normalizedLabelColors;


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
