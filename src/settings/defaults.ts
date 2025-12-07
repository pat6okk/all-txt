
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
    todoKeywords: ['TODO', 'WAIT', 'LATER'],
    doingKeywords: ['DOING', 'REVIEW'],
    doneKeywords: ['DONE', 'CANCELED'],
    scheduledKeywords: ['SCHEDULED'],
    deadlineKeywords: ['DEADLINE'],
    priorityQueues: [['#A', '#B', '#C']],
    priorityKeywords: [], // Deprecated
    workflows: [
        ['TODO', 'DOING', 'DONE'],
        ['WAIT', 'DOING', 'DONE'],
        ['LATER', 'DOING', 'DONE']
    ],
    keywordColors: {
        'TODO': '#ff5555',
        'WAIT': '#ffb86c',
        'LATER': '#6272a4',
        'DOING': '#f1fa8c',
        'REVIEW': '#8be9fd',
        'DONE': '#50fa7b',
        'CANCELED': '#bd93f9',
        'SCHEDULED': '#bd93f9',
        'DEADLINE': '#ff5555',
        '#A': '#ff5555',
        '#B': '#ffb86c',
        '#C': '#f1fa8c'
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

