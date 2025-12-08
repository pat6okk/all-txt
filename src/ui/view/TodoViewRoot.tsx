import * as React from 'react';
import { Task, TaskViewMode } from '../../task';
import { SortMethod } from '../../settings/defaults';
import { TodoToolbar } from './TodoToolbar';
import { TodoList } from './TodoList';

interface TodoViewRootProps {
    // Data
    tasks: Task[];
    allTasksCount: number;
    searchQuery: string;
    viewMode: TaskViewMode;
    sortMethod: SortMethod;
    filterActive: boolean;

    // Actions
    onSearchChange: (query: string) => void;
    onViewModeChange: (mode: TaskViewMode) => void;
    onSortMethodChange: (method: SortMethod) => void;
    onFilterActiveChange: (active: boolean) => void;

    // Item Actions
    onUpdateState: (task: Task, nextState: string) => void;
    onToggle: (task: Task) => void;
    onOpenTask: (task: Task, e: React.MouseEvent) => void;
    onContextMenu: (task: Task, e: React.MouseEvent) => void;
    // Phase 18
    onUpdatePriority: (task: Task, nextPriority: string | null) => void;
    onPriorityContextMenu: (task: Task, e: React.MouseEvent) => void;

    // Services / Utils
    getKeywordColor: (k: string) => string;
    getNextState: (c: string) => string;
    getContrastColor: (hex: string) => string;
    formatDate: (date: Date, includeTime?: boolean) => string;
    getDateClasses: (date: Date, isDeadline: boolean) => string[];
    // Phase 18
    getNextPriority: (current: string | null) => string | null;

    // Phase 17 Props
    keywordDescriptions: Record<string, string>;
    scheduledColor?: string;
    deadlineColor?: string;
    scheduledKeyword?: string;
    deadlineKeyword?: string;
}

export const TodoViewRoot: React.FC<TodoViewRootProps> = (props) => {

    return (
        <div className="todo-view-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <TodoToolbar
                searchQuery={props.searchQuery}
                onSearchChange={props.onSearchChange}
                viewMode={props.viewMode}
                onViewModeChange={props.onViewModeChange}
                sortMethod={props.sortMethod}
                onSortMethodChange={props.onSortMethodChange}
                filterActive={props.filterActive}
                onFilterActiveChange={props.onFilterActiveChange}
                taskCount={props.tasks.length}
                totalCount={props.allTasksCount}
            />

            <div className="todo-list-container" style={{ flex: 1, overflowY: 'auto' }}>
                <TodoList
                    tasks={props.tasks}
                    onUpdateState={props.onUpdateState}
                    onToggle={props.onToggle}
                    onOpenTask={props.onOpenTask}
                    onContextMenu={props.onContextMenu}
                    getKeywordColor={props.getKeywordColor}
                    getNextState={props.getNextState}
                    getContrastColor={props.getContrastColor}
                    formatDate={props.formatDate}
                    getDateClasses={props.getDateClasses}
                    emptyState={
                        props.allTasksCount === 0 ? (
                            <div className="todo-empty-state">
                                <p>No tasks found in vault.</p>
                                <p>Create a task using <code>- [ ] TODO item</code></p>
                            </div>
                        ) : (
                            <div className="todo-empty-state">
                                <p>No tasks match your filters.</p>
                            </div>
                        )
                    }
                    // Phase 17 Props
                    keywordDescriptions={props.keywordDescriptions}
                    scheduledColor={props.scheduledColor}
                    deadlineColor={props.deadlineColor}
                    scheduledKeyword={props.scheduledKeyword}
                    deadlineKeyword={props.deadlineKeyword}
                    // Phase 18
                    onUpdatePriority={props.onUpdatePriority}
                    onPriorityContextMenu={props.onPriorityContextMenu}
                    getNextPriority={props.getNextPriority}
                />
            </div>
        </div>
    );
};
