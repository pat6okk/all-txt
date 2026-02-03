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



  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Add a class for styling scope
    containerEl.addClass('flowtxt-settings-root');

    // Create a wrapper div for React
    const reactRoot = containerEl.createDiv();

    // Mount React App
    this.root = createRoot(reactRoot);
    this.root.render(createElement(SettingsView, {
      plugin: this.plugin,
      settingsService: this.plugin.settingsService
    }));
  }

  hide(): void {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
