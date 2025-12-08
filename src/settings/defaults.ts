
import { TaskViewMode } from "../task";
import { LanguageCommentSupportSettings, LanguageDefinition } from "../parser/language-registry";

export type SortMethod = 'default' | 'sortByScheduled' | 'sortByDeadline' | 'sortByPriority';

export interface TodoTrackerSettings {
    // Custom keyword groups
    todoKeywords: string[];
    doingKeywords: string[];
    doneKeywords: string[];
    scheduledKeywords: string[];
    deadlineKeywords: string[];
    priorityQueues: string[][]; // Array of priority groups (e.g. [['A','B','C'], ['P1','P2']])
    // Deprecated: Migrated to priorityQueues on load
    priorityKeywords: string[];
    workflows: string[][];

    // Color mapping: keyword -> hex color
    keywordColors: Record<string, string>;

    // Tooltip descriptions
    keywordDescriptions: Record<string, string>;

    includeCalloutBlocks: boolean;
    includeCodeBlocks: boolean;
    taskViewMode: TaskViewMode;

    // Persistence
    sortMethod: SortMethod;
    collapsedPaths: string[];

    languageCommentSupport: LanguageCommentSupportSettings;
}

export const DEFAULT_SETTINGS: TodoTrackerSettings = {
    todoKeywords: ['TODO', 'WAIT', 'ASK'],
    doingKeywords: ['DOING', 'IN PROGRESS'],
    doneKeywords: ['DONE', 'COMPLETED', 'CANCELLED', 'FACT'],
    scheduledKeywords: ['PLAN'],
    deadlineKeywords: ['DUE'],
    priorityQueues: [['P1', 'P2', 'P3', 'P4']],
    priorityKeywords: [], // Deprecated
    workflows: [
        ['TODO', 'DOING', 'DONE'],
        ['WAIT', 'DOING', 'DONE'],
        ['ASK', 'DOING', 'DONE']
    ],
    keywordColors: {
        // Start
        'TODO': '#FFB86C',
        'WAIT': '#8BE9FD',
        'ASK': '#BD93F9',
        // In-Progress
        'DOING': '#FFeb3B',
        'IN PROGRESS': '#FFeb3B',
        // Finished
        'DONE': '#50FA7B',
        'COMPLETED': '#50FA7B',
        'CANCELLED': '#FF5555',
        'FACT': '#44475A',
        // Dates
        'PLAN': '#6272A4',
        'DUE': '#FF79C6',
        // Priorities
        'P1': '#FF5555',
        'P2': '#FFB86C',
        'P3': '#F1FA8C',
        'P4': '#50FA7B'
    },
    keywordDescriptions: {},
    includeCalloutBlocks: true,
    includeCodeBlocks: false,
    taskViewMode: 'default',
    sortMethod: 'default',
    collapsedPaths: [],
    languageCommentSupport: {
        enabled: true,
    }
};

