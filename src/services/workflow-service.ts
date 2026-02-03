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
     * 
     * US-3.2: Global Return Logic
     * - When a workflow reaches its final state, instead of cycling to its own start,
     *   it looks for the "global return" defined by the FIRST workflow that shares that end state.
     * - This allows secondary workflows to inherit the return behavior of the primary workflow.
     * 
     * Example:
     * - Workflow 1: TODO → DOING → DONE → (back to TODO)
     * - Workflow 2: LATER → DOING → DONE → (inherits: back to TODO, not LATER)
     * 
     * Logic:
     * 1. Find the workflow containing the current state
     * 2. If at the end of the workflow:
     *    a. Look for the FIRST workflow that also ends with the same state
     *    b. Return to the START of that first workflow
     * 3. Otherwise, advance normally within the current workflow
     */
    getNextState(currentState: string): string {
        const workflows = this.settings.workflows || [];

        // 1. Find which workflow contains the current state
        for (let i = 0; i < workflows.length; i++) {
            const flow = workflows[i];
            const index = flow.indexOf(currentState);

            if (index !== -1) {
                // Found the state in this workflow!

                // 2. Check if we're at the end of this workflow
                if (index === flow.length - 1) {
                    // We're at the final state of this workflow
                    const finalState = flow[index];

                    // 3. Find the FIRST workflow that also ends with this state
                    // (This defines the "global return" for this end state)
                    const primaryWorkflow = workflows.find(w =>
                        w.length > 0 && w[w.length - 1] === finalState
                    );

                    if (primaryWorkflow && primaryWorkflow.length > 0) {
                        // Return to the START of the primary workflow
                        return primaryWorkflow[0];
                    }

                    // Fallback: if no primary workflow found, cycle to own start
                    return flow[0];
                } else {
                    // Not at the end, advance normally
                    return flow[index + 1];
                }
            }
        }

        // 2. Fallback: State not found in any workflow
        // Use semantic logic (legacy/safety net)
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
