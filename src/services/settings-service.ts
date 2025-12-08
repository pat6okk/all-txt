import { TodoTrackerSettings, DEFAULT_SETTINGS } from '../settings/defaults';
import TodoInlinePlugin from '../main';

// Central service for manipulating settings
// Replaces disjointed logic in React components
export class SettingsService {
    private plugin: TodoInlinePlugin;

    constructor(plugin: TodoInlinePlugin) {
        this.plugin = plugin;
    }

    get settings(): TodoTrackerSettings {
        return this.plugin.settings;
    }

    // Generic saver
    private async save() {
        await this.plugin.saveSettings();
        // Trigger updates if necessary (parser, store)
        this.plugin.recreateParser();
        this.plugin.taskStore.scanVault();
    }

    // --- Vocabulary Management ---

    async updateVocabulary(
        type: 'todoKeywords' | 'doingKeywords' | 'doneKeywords',
        newKeywords: string[],
        oldKeyword?: string
    ) {
        // Handle smart color migration
        if (oldKeyword) {
            this.handleColorMigration(this.settings[type], newKeywords, oldKeyword, this.getDefaultColorForType(type));
        }

        this.settings[type] = newKeywords;

        // Cascade to Workflows if Start Keywords changed
        if (type === 'todoKeywords') {
            this.syncWorkflowsWithStartKeywords();
        }

        await this.save();
    }

    private getDefaultColorForType(type: string): string {
        switch (type) {
            case 'todoKeywords': return '#8BE9FD';
            case 'doingKeywords': return '#FFeb3B';
            case 'doneKeywords': return '#50FA7B';
            case 'scheduledKeywords': return '#6272A4';
            case 'deadlineKeywords': return '#FF79C6';
            default: return '#888888';
        }
    }

    // Synchronize flows when Start keywords change
    private syncWorkflowsWithStartKeywords() {
        const currentWorkflows = this.settings.workflows;
        const newWorkflows: string[][] = [];
        const defaultDone = this.settings.doneKeywords[0] || 'DONE';

        this.settings.todoKeywords.forEach(k => {
            const existing = currentWorkflows.find(w => w[0] === k);
            if (existing) newWorkflows.push([...existing]);
            else newWorkflows.push([k, defaultDone]);
        });
        this.settings.workflows = newWorkflows;
    }

    // --- Metadata Management ---

    async updateDateKeywords(type: 'scheduledKeywords' | 'deadlineKeywords', newKeywords: string[], oldKeyword?: string) {
        if (oldKeyword) {
            this.handleColorMigration(this.settings[type], newKeywords, oldKeyword, this.getDefaultColorForType(type));
        }
        this.settings[type] = newKeywords;
        await this.save();
    }

    async updatePriorityGroup(groupIdx: number, newKeywords: string[], oldKeyword?: string) {
        const currentGroup = this.settings.priorityQueues[groupIdx] || [];
        if (oldKeyword) {
            this.handleColorMigration(currentGroup, newKeywords, oldKeyword);
        }

        const newQueues = [...this.settings.priorityQueues];
        newQueues[groupIdx] = newKeywords;
        this.settings.priorityQueues = newQueues;
        await this.save();
    }

    async addPriorityGroup() {
        const nextId = this.settings.priorityQueues.flat().length + 1;
        const newQueues = [...this.settings.priorityQueues, ['P' + nextId]];
        this.settings.priorityQueues = newQueues;
        await this.save();
    }

    async deletePriorityGroup(groupIdx: number) {
        const group = this.settings.priorityQueues[groupIdx];
        // Cleanup colors
        group.forEach(k => this.deleteKeywordMetadata(k));

        const newQueues = [...this.settings.priorityQueues];
        newQueues.splice(groupIdx, 1);
        this.settings.priorityQueues = newQueues;
        await this.save();
    }

    // --- Core Logic: Color Migration ---

    private handleColorMigration(
        currentList: string[],
        newList: string[],
        oldKeyword: string,
        defaultColorHex?: string
    ) {
        const lost = currentList.filter(k => !newList.includes(k));
        const gained = newList.filter(k => !currentList.includes(k));

        // Case 1: Rename (1 lost, 1 gained) - STRICT check
        if (lost.length === 1 && gained.length === 1 && lost[0] === oldKeyword) {
            const oldK = lost[0];
            const newK = gained[0];

            // Migrate Color
            if (this.settings.keywordColors[oldK]) {
                this.settings.keywordColors[newK] = this.settings.keywordColors[oldK];
                delete this.settings.keywordColors[oldK];
            }
            // Migrate Description
            if (this.settings.keywordDescriptions[oldK]) {
                this.settings.keywordDescriptions[newK] = this.settings.keywordDescriptions[oldK];
                delete this.settings.keywordDescriptions[oldK];
            }
        }
        // Case 2: New Keyword Added
        else if (gained.length > 0) {
            gained.forEach(newK => {
                if (!this.settings.keywordColors[newK] && defaultColorHex) {
                    this.settings.keywordColors[newK] = defaultColorHex;
                }
            });
        }
    }

    // --- Helpers ---

    getKeywordColor(k: string): string {
        return this.settings.keywordColors[k] || '#888888';
    }

    getKeywordDescription(k: string): string {
        return this.settings.keywordDescriptions[k] || '';
    }

    async updateKeywordMetadata(k: string, color: string, description: string) {
        this.settings.keywordColors[k] = color;
        this.settings.keywordDescriptions[k] = description;
        await this.save();
    }

    async deleteKeywordFromVocabulary(type: 'todoKeywords' | 'doingKeywords' | 'doneKeywords', idx: number) {
        const k = this.settings[type][idx];
        // Remove from list
        const newKw = [...this.settings[type]];
        newKw.splice(idx, 1);

        // Cleanup
        this.deleteKeywordMetadata(k);
        await this.updateVocabulary(type, newKw);
    }

    private deleteKeywordMetadata(k: string) {
        if (this.settings.keywordColors[k]) delete this.settings.keywordColors[k];
        if (this.settings.keywordDescriptions[k]) delete this.settings.keywordDescriptions[k];
    }

    async updateWorkflows(workflows: string[][]) {
        this.settings.workflows = workflows;
        await this.save();
    }


    // --- Resets ---

    async resetVocabulary() {
        this.settings.todoKeywords = [...DEFAULT_SETTINGS.todoKeywords];
        this.settings.doingKeywords = [...DEFAULT_SETTINGS.doingKeywords];
        this.settings.doneKeywords = [...DEFAULT_SETTINGS.doneKeywords];

        this.applyDefaultColors([
            ...DEFAULT_SETTINGS.todoKeywords,
            ...DEFAULT_SETTINGS.doingKeywords,
            ...DEFAULT_SETTINGS.doneKeywords
        ]);
        await this.save();
    }

    async resetWorkflows() {
        this.settings.workflows = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.workflows));
        await this.save();
    }

    async resetDateKeywords() {
        this.settings.scheduledKeywords = [...DEFAULT_SETTINGS.scheduledKeywords];
        this.settings.deadlineKeywords = [...DEFAULT_SETTINGS.deadlineKeywords];

        this.applyDefaultColors([
            ...DEFAULT_SETTINGS.scheduledKeywords,
            ...DEFAULT_SETTINGS.deadlineKeywords
        ]);
        await this.save();
    }

    async resetPriorities() {
        this.settings.priorityQueues = JSON.parse(JSON.stringify(DEFAULT_SETTINGS.priorityQueues));
        this.applyDefaultColors(DEFAULT_SETTINGS.priorityQueues.flat());
        await this.save();
    }

    private applyDefaultColors(keywords: string[]) {
        keywords.forEach(k => {
            if (DEFAULT_SETTINGS.keywordColors[k]) {
                this.settings.keywordColors[k] = DEFAULT_SETTINGS.keywordColors[k];
            }
        });
    }

}
