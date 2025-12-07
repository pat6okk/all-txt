import { PluginSettingTab, App } from 'obsidian';
import TodoTracker from '../main';
import { TodoView } from '../view/task-view';
import { createRoot, Root } from 'react-dom/client';
import { createElement } from 'react';
import { SettingsView } from '../ui/settings/SettingsView';

export class TodoTrackerSettingTab extends PluginSettingTab {
  plugin: TodoTracker;
  root: Root | null = null;

  constructor(app: App, plugin: TodoTracker) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // Legacy Refresh method - likely to be moved to a Context or Service
  private refreshAllTaskViews = async () => {
    // Notify all views to refresh
    const leaves = this.app.workspace.getLeavesOfType(TodoView.viewType);
    for (const leaf of leaves) {
      if (leaf.view instanceof TodoView) {
        leaf.view.refreshVisibleList();
      }
    }
  }

  // Legacy helper - kept for compatibility if referenced elsewhere, 
  // but React components should use their own logic or a shared utility.
  getKeywordColor(keyword: string): string {
    return this.plugin.settings.keywordColors[keyword] || '#888888';
  }

  async setKeywordColor(keyword: string, color: string) {
    this.plugin.settings.keywordColors[keyword] = color;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Add a class for styling scope
    containerEl.addClass('todo-inline-settings-root');

    // Create a wrapper div for React
    const reactRoot = containerEl.createDiv();

    // Mount React App
    this.root = createRoot(reactRoot);
    this.root.render(createElement(SettingsView, { plugin: this.plugin }));
  }

  hide(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
