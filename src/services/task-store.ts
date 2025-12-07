
import { App, Events, TAbstractFile, TFile, Vault, Workspace } from 'obsidian';
import { Task } from '../task';
import { TodoTrackerSettings } from "../settings/defaults";
import { TaskParser } from '../parser/task-parser';

export class TaskStore extends Events {
    private app: App;
    private settings: TodoTrackerSettings;
    private tasks: Task[] = [];
    private parser: TaskParser | null = null;

    // Scan state
    private isScanning = false;
    private updateDebounceTimer: number | null = null;
    private readonly DEBOUNCE_MS = 200;

    constructor(app: App, settings: TodoTrackerSettings) {
        super();
        this.app = app;
        this.settings = settings;
        this.recreateParser();
    }

    public getTasks(): Task[] {
        return this.tasks;
    }

    public getSettings(): TodoTrackerSettings {
        return this.settings;
    }

    public updateSettings(settings: TodoTrackerSettings) {
        this.settings = settings;
        this.recreateParser();
        // Re-scan is usually needed when settings (keywords) change
        this.scanVault();
    }

    private recreateParser() {
        this.parser = TaskParser.create(this.settings);
    }

    // Shared comparator to ensure consistent ordering
    private readonly taskComparator = (a: Task, b: Task): number => {
        if (a.path === b.path) return a.line - b.line;
        return a.path.localeCompare(b.path);
    };

    /**
     * Triggers a UI update notification with debounce to prevent excessive renders.
     */
    private requestUpdate() {
        if (this.updateDebounceTimer) {
            window.clearTimeout(this.updateDebounceTimer);
        }
        this.updateDebounceTimer = window.setTimeout(() => {
            this.trigger('update', this.tasks);
            this.updateDebounceTimer = null;
        }, this.DEBOUNCE_MS);
    }

    // Yield a frame to keep UI responsive during long operations
    private async yieldToEventLoop(): Promise<void> {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }

    /**
     * Full vault scan. 
     * SHOULD ONLY BE CALLED ON INIT or MAJOR CONFIG CHANGE.
     */
    async scanVault() {
        if (this.isScanning) return;
        this.isScanning = true;

        try {
            console.log('TaskStore: Starting full vault scan...');
            const newTasks: Task[] = [];
            const files = this.app.vault.getFiles();

            // Yield configuration
            const YIELD_EVERY_FILES = 50; // Increased batch size slightly
            let processedMd = 0;

            for (const file of files) {
                if (file.extension === 'md') {
                    const fileTasks = await this.scanFileInternal(file);
                    newTasks.push(...fileTasks);
                    processedMd++;

                    if (processedMd % YIELD_EVERY_FILES === 0) {
                        await this.yieldToEventLoop();
                    }
                }
            }

            this.tasks = newTasks;
            this.tasks.sort(this.taskComparator);
            console.log(`TaskStore: Scan complete.Found ${this.tasks.length} tasks.`);
            this.trigger('update', this.tasks); // Immediate update after full scan
        } catch (err) {
            console.error('TaskStore: Error during vault scan', err);
        } finally {
            this.isScanning = false;
        }
    }

    /**
     * Internal: reads file and parses tasks.
     * Does NOT update state directly, returns tasks.
     */
    private async scanFileInternal(file: TFile): Promise<Task[]> {
        try {
            const content = await this.app.vault.read(file);
            if (!this.parser) this.recreateParser();
            return this.parser!.parseFile(content, file.path);
        } catch (err) {
            console.error(`TaskStore: Failed to read file ${file.path} `, err);
            return [];
        }
    }

    // --- Event Handlers (Called by main.ts or wired directly) ---

    async handleFileChange(file: TAbstractFile) {
        if (!(file instanceof TFile) || file.extension !== 'md') return;

        // 1. Remove existing tasks for this file
        this.tasks = this.tasks.filter(t => t.path !== file.path);

        // 2. Scan new content
        const stillExists = this.app.vault.getAbstractFileByPath(file.path) instanceof TFile;
        if (stillExists) {
            const newTasks = await this.scanFileInternal(file);
            this.tasks.push(...newTasks);
        }

        // 3. Sort and Notify
        this.tasks.sort(this.taskComparator);
        this.requestUpdate();
    }

    async handleFileRename(file: TAbstractFile, oldPath: string) {
        // 1. Remove tasks for old path
        this.tasks = this.tasks.filter(t => t.path !== oldPath);

        // 2. Scan at new location
        if (file instanceof TFile && file.extension === 'md') {
            const newTasks = await this.scanFileInternal(file);
            this.tasks.push(...newTasks);
        }

        // 3. Sort and Notify
        this.tasks.sort(this.taskComparator);
        this.requestUpdate();
    }

    async handleFileDelete(file: TAbstractFile) {
        if (!(file instanceof TFile) || file.extension !== 'md') return;

        const initialCount = this.tasks.length;
        this.tasks = this.tasks.filter(t => t.path !== file.path);

        if (this.tasks.length !== initialCount) {
            this.requestUpdate();
        }
    }
}
