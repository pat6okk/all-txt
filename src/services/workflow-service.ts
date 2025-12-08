import { TodoTrackerSettings } from "../settings/defaults";

export class WorkflowService {
    private settings: TodoTrackerSettings;

    constructor(settings: TodoTrackerSettings) {
        this.settings = settings;
    }

    updateSettings(settings: TodoTrackerSettings) {
        this.settings = settings;
    }

    getPendingKeywords(): string[] {
        return this.settings.todoKeywords || [];
    }

    getActiveKeywords(): string[] {
        return this.settings.doingKeywords || [];
    }

    getCompletedKeywords(): string[] {
        return this.settings.doneKeywords || [];
    }

    getAllKeywords(): string[] {
        return [
            ...this.getPendingKeywords(),
            ...this.getActiveKeywords(),
            ...this.getCompletedKeywords()
        ];
    }

    getKeywordColor(keyword: string): string {
        return this.settings.keywordColors?.[keyword] || '#888888';
    }

    /**
     * Determines the next state for a task based on the configured workflow.
     * Logic:
     * - If in PENDING -> go to first ACTIVE state (or DONE if no active).
     * - If in ACTIVE -> go to first DONE state.
     * - If in DONE -> go to first PENDING state (cycle).
     * - If unknown -> go to DONE.
     */
    getNextState(currentState: string): string {
        // 1. Check custom workflows first
        const workflows = this.settings.workflows || [];
        for (const flow of workflows) {
            const index = flow.indexOf(currentState);
            if (index !== -1) {
                // Found the state in a workflow!
                // Cycle to next state (loop back to start if at end)
                const nextIndex = (index + 1) % flow.length;
                return flow[nextIndex];
            }
        }

        // 2. Fallback: Parsing/Semantic logic (Legacy/Safety net)
        // If the state isn't in any configured workflow, we fall back to the semantic lists
        // to determine if it's "Pending" or "Active" and move it forward linearly.
        // However, specifically for semantic fallback, we'll just cycle linearly through All Keywords
        // to avoid getting stuck, but this should rarely happen if workflows are set up correctly.
        const allKeywords = this.getAllKeywords();
        const cleanKeywords = allKeywords.filter(k => k && k.trim().length > 0);

        if (cleanKeywords.length === 0) return 'DONE';

        const currentIndex = cleanKeywords.indexOf(currentState);
        if (currentIndex === -1) {
            return cleanKeywords[0];
        }

        const nextIndex = (currentIndex + 1) % cleanKeywords.length;
        return cleanKeywords[nextIndex];
    }

    isCompleted(state: string): boolean {
        return this.getCompletedKeywords().includes(state);
    }

    // Expose groups for UI
    getPriorityGroups(): string[][] {
        return this.settings.priorityQueues || [];
    }

    getAllPriorities(): string[] {
        return this.getPriorityGroups().flat();
    }

    getNextPriority(current: string | null): string | null {
        const groups = this.getPriorityGroups();
        if (groups.length === 0) return null;

        // If no priority, verify default start (first of first group)
        if (!current) {
            const firstGroup = groups[0];
            return firstGroup && firstGroup.length > 0 ? firstGroup[0] : null;
        }

        // Find which group the current priority belongs to
        for (const group of groups) {
            const index = group.indexOf(current);
            if (index !== -1) {
                // Found in this group. Cycle strictly within this group.
                // A -> B -> C -> A (User requested loop, not null)
                const nextIndex = (index + 1) % group.length;
                return group[nextIndex];
            }
        }

        // If unknown priority (not in any group), maybe switch to first valid?
        const firstGroup = groups[0];
        return firstGroup && firstGroup.length > 0 ? firstGroup[0] : null;
    }
}
