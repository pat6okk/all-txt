
import { TaskViewMode } from "../task";
import { LanguageCommentSupportSettings, LanguageDefinition } from "../parser/language-registry";
import { DateInputFormat } from "../parser/date-parser";

export type SortMethod = 'default' | 'sortByScheduled' | 'sortByDeadline' | 'sortByPriority';
export type GroupingMethod = 'none' | 'byState' | 'byFile';
export type DateFilterMode = 'all' | 'overdue' | 'today' | 'thisWeek' | 'noDate';

export interface AdvancedFilters {
    states: string[]; // Empty array = show all states
    priorities: string[]; // Empty array = show all priorities
    labels: string[]; // Empty array = show all labels - Épica 5
    dateMode: DateFilterMode;
}

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
    groupingMethod: GroupingMethod;
    advancedFilters: AdvancedFilters;
    collapsedPaths: string[];

    // Date formatting
    dateFormat: DateInputFormat;

    // Labels system - Épica 5
    labelMode: 'free' | 'defined'; // 'free' = any @text is a label, 'defined' = only predefined labels
    definedLabels: string[]; // List of predefined labels when in 'defined' mode
    labelColors: Record<string, string>; // label -> hex color

    // Block parsing
    blockKeywords: string[];
    blockDelimiterPresets: string[]; // Library of available delimiters


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
        'P4': '#50FA7B',
        // Block Delimiters
        'END-FLOW': '#6272A4',
        'FIN': '#6272A4',
        'STOP': '#6272A4',
        'BLOCK-END': '#6272A4'
    },
    keywordDescriptions: {},
    includeCalloutBlocks: true,
    includeCodeBlocks: false,
    taskViewMode: 'default',
    sortMethod: 'default',
    groupingMethod: 'none',
    advancedFilters: {
        states: [],
        priorities: [],
        labels: [],
        dateMode: 'all'
    },
    collapsedPaths: [],
    dateFormat: 'DD/MM/YYYY',
    // Labels - Épica 5
    labelMode: 'free',
    definedLabels: [],
    labelColors: {},
    // Block parsing
    blockKeywords: ['END-FLOW'],
    blockDelimiterPresets: ['END-FLOW', 'FIN', 'STOP', 'BLOCK-END', '---', '***'],
    languageCommentSupport: {
        enabled: true,
    }
};

