import * as React from 'react';
import { Task, TaskViewMode } from '../../task';
import { SortMethod, GroupingMethod, AdvancedFilters } from '../../settings/defaults';
import { TodoToolbar } from './TodoToolbar';
import { TodoList } from './TodoList';

interface TodoViewRootProps {
    // Data
    tasks: Task[];
    allTasksCount: number;
    searchQuery: string;
    viewMode: TaskViewMode;
    sortMethod: SortMethod;
    groupingMethod: GroupingMethod;
    advancedFilters: AdvancedFilters;
    availableStates?: string[];
    availablePriorities?: string[];
    filterActive: boolean;

    // Actions
    onSearchChange: (query: string) => void;
    onViewModeChange: (mode: TaskViewMode) => void;
    onSortMethodChange: (method: SortMethod) => void;
    onGroupingMethodChange: (method: GroupingMethod) => void;
    onAdvancedFiltersChange: (filters: AdvancedFilters) => void;
    onFilterActiveChange: (active: boolean) => void;

    // Item Actions
    onUpdateState: (task: Task, nextState: string) => void;
    onToggle: (task: Task) => void;
    onOpenTask: (task: Task, e: React.MouseEvent) => void;
    onContextMenu: (task: Task, e: React.MouseEvent) => void;
    // Phase 18
    onUpdatePriority: (task: Task, nextPriority: string | null) => void;
    onPriorityContextMenu: (task: Task, e: React.MouseEvent) => void;
    // US-4.1: Date management
    onDateContextMenu: (task: Task, dateType: 'scheduled' | 'deadline', e: React.MouseEvent) => void;

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
    // Grouping logic
    const groupTasks = () => {
        if (props.groupingMethod === 'byState') {
            // Group by state
            const groups = new Map<string, Task[]>();
            props.tasks.forEach(task => {
                const state = task.state;
                if (!groups.has(state)) {
                    groups.set(state, []);
                }
                groups.get(state)!.push(task);
            });
            // Return as array of [state, tasks[]]
            return Array.from(groups.entries());
        } else if (props.groupingMethod === 'byFile') {
            // Group by file
            const groups = new Map<string, Task[]>();
            props.tasks.forEach(task => {
                const file = task.path;
                if (!groups.has(file)) {
                    groups.set(file, []);
                }
                groups.get(file)!.push(task);
            });
            return Array.from(groups.entries());
        }
        return null; // No grouping
    };

    const groups = groupTasks();

    return (
        <div className="todo-view-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <TodoToolbar
                searchQuery={props.searchQuery}
                onSearchChange={props.onSearchChange}
                viewMode={props.viewMode}
                onViewModeChange={props.onViewModeChange}
                sortMethod={props.sortMethod}
                onSortMethodChange={props.onSortMethodChange}
                groupingMethod={props.groupingMethod}
                onGroupingMethodChange={props.onGroupingMethodChange}
                advancedFilters={props.advancedFilters}
                onAdvancedFiltersChange={props.onAdvancedFiltersChange}
                availableStates={props.availableStates}
                availablePriorities={props.availablePriorities}
                filterActive={props.filterActive}
                onFilterActiveChange={props.onFilterActiveChange}
                taskCount={props.tasks.length}
                totalCount={props.allTasksCount}
            />

            <div className="todo-list-container" style={{ flex: 1, overflowY: 'auto' }}>
                {groups ? (
                    // Render grouped sections
                    <div className="todo-grouped-view">
                        {groups.map(([groupName, groupTasks]) => (
                            <TaskGroup
                                key={groupName}
                                groupName={groupName}
                                tasks={groupTasks}
                                onUpdateState={props.onUpdateState}
                                onToggle={props.onToggle}
                                onOpenTask={props.onOpenTask}
                                onContextMenu={props.onContextMenu}
                                getKeywordColor={props.getKeywordColor}
                                getNextState={props.getNextState}
                                getContrastColor={props.getContrastColor}
                                formatDate={props.formatDate}
                                getDateClasses={props.getDateClasses}
                                keywordDescriptions={props.keywordDescriptions}
                                scheduledColor={props.scheduledColor}
                                deadlineColor={props.deadlineColor}
                                scheduledKeyword={props.scheduledKeyword}
                                deadlineKeyword={props.deadlineKeyword}
                                onUpdatePriority={props.onUpdatePriority}
                                onPriorityContextMenu={props.onPriorityContextMenu}
                                getNextPriority={props.getNextPriority}
                                onDateContextMenu={props.onDateContextMenu}
                            />
                        ))}
                    </div>
                ) : (
                    // Render flat list
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
                        keywordDescriptions={props.keywordDescriptions}
                        scheduledColor={props.scheduledColor}
                        deadlineColor={props.deadlineColor}
                        scheduledKeyword={props.scheduledKeyword}
                        deadlineKeyword={props.deadlineKeyword}
                        onUpdatePriority={props.onUpdatePriority}
                        onPriorityContextMenu={props.onPriorityContextMenu}
                        getNextPriority={props.getNextPriority}
                        onDateContextMenu={props.onDateContextMenu}
                    />
                )}
            </div>
        </div>
    );
};

// TaskGroup Component (Collapsible Section)
interface TaskGroupProps {
    groupName: string;
    tasks: Task[];
    onUpdateState: (task: Task, nextState: string) => void;
    onToggle: (task: Task) => void;
    onOpenTask: (task: Task, e: React.MouseEvent) => void;
    onContextMenu: (task: Task, e: React.MouseEvent) => void;
    getKeywordColor: (k: string) => string;
    getNextState: (c: string) => string;
    getContrastColor: (hex: string) => string;
    formatDate: (date: Date, includeTime?: boolean) => string;
    getDateClasses: (date: Date, isDeadline: boolean) => string[];
    keywordDescriptions: Record<string, string>;
    scheduledColor?: string;
    deadlineColor?: string;
    scheduledKeyword?: string;
    deadlineKeyword?: string;
    onUpdatePriority: (task: Task, nextPriority: string | null) => void;
    onPriorityContextMenu: (task: Task, e: React.MouseEvent) => void;
    getNextPriority: (current: string | null) => string | null;
    onDateContextMenu: (task: Task, dateType: 'scheduled' | 'deadline', e: React.MouseEvent) => void;
}

const TaskGroup: React.FC<TaskGroupProps> = (props) => {
    const [collapsed, setCollapsed] = React.useState(false);

    const color = props.getKeywordColor(props.groupName);
    const contrast = props.getContrastColor(color);

    return (
        <div className="task-group" style={{ marginBottom: '12px' }}>
            <div
                className="task-group-header"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'var(--background-secondary)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginBottom: collapsed ? 0 : '8px'
                }}
                onClick={() => setCollapsed(!collapsed)}
            >
                <svg
                    viewBox="0 0 100 100"
                    width="12"
                    height="12"
                    fill="var(--text-normal)"
                    style={{
                        transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                        transition: 'transform 0.15s ease',
                        marginRight: '8px'
                    }}
                >
                    <path d="M 30,20 L 80,50 L 30,80 Z" />
                </svg>

                <span
                    className="task-group-label"
                    style={{
                        backgroundColor: color,
                        color: contrast,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.9em',
                        fontWeight: 'bold',
                        marginRight: '8px'
                    }}
                >
                    {props.groupName}
                </span>

                <span style={{ color: 'var(--text-muted)', fontSize: '0.85em' }}>
                    ({props.tasks.length})
                </span>
            </div>

            {!collapsed && (
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
                    emptyState={null}
                    keywordDescriptions={props.keywordDescriptions}
                    scheduledColor={props.scheduledColor}
                    deadlineColor={props.deadlineColor}
                    scheduledKeyword={props.scheduledKeyword}
                    deadlineKeyword={props.deadlineKeyword}
                    onUpdatePriority={props.onUpdatePriority}
                    onPriorityContextMenu={props.onPriorityContextMenu}
                    getNextPriority={props.getNextPriority}
                    onDateContextMenu={props.onDateContextMenu}
                />
            )}
        </div>
    );
};
