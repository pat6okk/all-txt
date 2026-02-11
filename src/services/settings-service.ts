import { TodoTrackerSettings, DEFAULT_SETTINGS } from '../settings/defaults';
import FlowTxtPlugin from '../main';
import {
    buildDefinedLabelMap,
    dedupeLabelsCaseInsensitive,
    normalizeLabelKey,
    toValidLabelDisplay,
} from '../labels/label-utils';

// Central service for manipulating settings
// Replaces disjointed logic in React components
export class SettingsService {
    private plugin: FlowTxtPlugin;

    constructor(plugin: FlowTxtPlugin) {
        this.plugin = plugin;
    }

    get settings(): TodoTrackerSettings {
        return this.plugin.settings;
    }

    // Generic saver
    private async save() {
        this.normalizeLabelState();
        await this.plugin.saveSettings();
        // Trigger updates if necessary (parser, store)
        this.plugin.recreateParser();
        this.plugin.taskStore.scanVault();
    }

    private normalizeLabelState() {
        this.settings.definedLabels = dedupeLabelsCaseInsensitive(this.settings.definedLabels || []);

        const currentColors = this.settings.labelColors || {};
        const normalizedColors: Record<string, string> = {};
        for (const [rawLabel, color] of Object.entries(currentColors)) {
            const valid = toValidLabelDisplay(rawLabel);
            if (!valid) {
                continue;
            }
            normalizedColors[normalizeLabelKey(valid)] = color;
        }
        this.settings.labelColors = normalizedColors;
    }

    // --- Vocabulary Management ---

    async updateVocabulary(
        type: 'todoKeywords' | 'doingKeywords' | 'doneKeywords' | 'blockKeywords',
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
            case 'blockKeywords': return '#6272A4';
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

    // --- Labels Management ---

    getDefinedLabelMap(): Map<string, string> {
        return buildDefinedLabelMap(this.settings.definedLabels || []);
    }

    getOrderedDefinedLabels(): string[] {
        return dedupeLabelsCaseInsensitive(this.settings.definedLabels || []);
    }

    getLabelColor(label: string): string {
        const valid = toValidLabelDisplay(label);
        if (!valid) {
            return '#BD93F9';
        }

        const key = normalizeLabelKey(valid);
        return this.settings.labelColors[key]
            || this.settings.labelColors[valid]
            || this.settings.labelColors[`@${valid}`]
            || '#BD93F9';
    }

    async setLabelColor(label: string, color: string) {
        const valid = toValidLabelDisplay(label);
        if (!valid) {
            return;
        }
        const key = normalizeLabelKey(valid);
        this.settings.labelColors[key] = color;
        await this.save();
    }

    async updateLabelMode(mode: 'free' | 'defined') {
        this.settings.labelMode = mode;
        await this.save();
    }

    async upsertDefinedLabel(rawLabel: string): Promise<string | null> {
        const valid = toValidLabelDisplay(rawLabel);
        if (!valid) {
            return null;
        }

        const map = this.getDefinedLabelMap();
        const existing = map.get(normalizeLabelKey(valid));
        if (existing) {
            return existing;
        }

        this.settings.definedLabels = [...(this.settings.definedLabels || []), valid];
        await this.save();
        return valid;
    }

    async removeDefinedLabel(label: string) {
        const valid = toValidLabelDisplay(label);
        if (!valid) {
            return;
        }

        const key = normalizeLabelKey(valid);
        this.settings.definedLabels = (this.settings.definedLabels || []).filter(
            existing => normalizeLabelKey(existing) !== key
        );
        delete this.settings.labelColors[key];
        await this.save();
    }

    async renameDefinedLabel(oldLabel: string, newLabelRaw: string): Promise<string | null> {
        const newLabel = toValidLabelDisplay(newLabelRaw);
        if (!newLabel) {
            return null;
        }

        const oldKey = normalizeLabelKey(oldLabel);
        const newKey = normalizeLabelKey(newLabel);
        const labels = [...(this.settings.definedLabels || [])];
        const targetIndex = labels.findIndex(label => normalizeLabelKey(label) === oldKey);

        if (targetIndex === -1) {
            return null;
        }

        const collision = labels.find(
            (label, index) => index !== targetIndex && normalizeLabelKey(label) === newKey
        );
        if (collision) {
            return collision;
        }

        labels[targetIndex] = newLabel;
        this.settings.definedLabels = labels;

        if (oldKey !== newKey && this.settings.labelColors[oldKey]) {
            this.settings.labelColors[newKey] = this.settings.labelColors[oldKey];
            delete this.settings.labelColors[oldKey];
        }

        await this.save();
        return newLabel;
    }

    async moveDefinedLabel(index: number, direction: 'up' | 'down') {
        const labels = [...(this.settings.definedLabels || [])];
        const target = direction === 'up' ? index - 1 : index + 1;
        if (index < 0 || index >= labels.length || target < 0 || target >= labels.length) {
            return;
        }

        [labels[index], labels[target]] = [labels[target], labels[index]];
        this.settings.definedLabels = labels;
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

    getContrastColor(hexcolor: string): string {
        try {
            const hex = hexcolor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            return (yiq >= 128) ? 'black' : 'white';
        } catch (e) {
            return 'white';
        }
    }

    async deleteKeywordFromVocabulary(type: 'todoKeywords' | 'doingKeywords' | 'doneKeywords' | 'blockKeywords', idx: number) {
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

    // --- Block Delimiter Presets ---

    async addBlockPreset(newPreset: string) {
        if (!this.settings.blockDelimiterPresets.includes(newPreset)) {
            this.settings.blockDelimiterPresets = [...this.settings.blockDelimiterPresets, newPreset];
            // Initialize with default color if not exists
            if (!this.settings.keywordColors[newPreset]) {
                await this.updateKeywordMetadata(newPreset, '#6272A4', '');
            } else {
                await this.save();
            }
        }
    }

    async deleteBlockPreset(preset: string) {
        this.settings.blockDelimiterPresets = this.settings.blockDelimiterPresets.filter(p => p !== preset);

        // If we deleted the active delimiter, switch to default or first available
        if (this.settings.blockKeywords.length > 0 && this.settings.blockKeywords[0] === preset) {
            const next = this.settings.blockDelimiterPresets[0] || 'END-FLOW';
            this.settings.blockKeywords = [next];
        }

        await this.save();
    }

    async resetBlockPresets() {
        this.settings.blockDelimiterPresets = [...DEFAULT_SETTINGS.blockDelimiterPresets];
        this.settings.blockKeywords = [...DEFAULT_SETTINGS.blockKeywords];
        // Apply default colors
        DEFAULT_SETTINGS.blockDelimiterPresets.forEach(k => {
            if (DEFAULT_SETTINGS.keywordColors[k]) {
                this.settings.keywordColors[k] = DEFAULT_SETTINGS.keywordColors[k];
            }
        });
        await this.save();
    }


    // --- Resets ---

    async resetVocabulary() {
        this.settings.todoKeywords = [...DEFAULT_SETTINGS.todoKeywords];
        this.settings.doingKeywords = [...DEFAULT_SETTINGS.doingKeywords];
        this.settings.doneKeywords = [...DEFAULT_SETTINGS.doneKeywords];
        this.settings.blockKeywords = [...DEFAULT_SETTINGS.blockKeywords];

        this.applyDefaultColors([
            ...DEFAULT_SETTINGS.todoKeywords,
            ...DEFAULT_SETTINGS.doingKeywords,
            ...DEFAULT_SETTINGS.doneKeywords,
            ...DEFAULT_SETTINGS.blockKeywords
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

    /**
     * Generic setting updater for simple fields
     * @param key Setting key to update
     * @param value New value
     */
    async updateSetting<K extends keyof TodoTrackerSettings>(key: K, value: TodoTrackerSettings[K]) {
        this.settings[key] = value;
        await this.save();
    }

}
