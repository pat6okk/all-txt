import * as React from 'react';
import { Task } from '../../task';
import { TaskGroup } from './TaskGroup';

interface TodoListProps {
    tasks: Task[];
    onUpdateState: (task: Task, nextState: string) => void;
    onToggle: (task: Task) => void;
    onOpenTask: (task: Task, e: React.MouseEvent) => void;
    onContextMenu: (task: Task, e: React.MouseEvent) => void;
    getKeywordColor: (k: string) => string;
    getLabelColor: (label: string) => string;
    getNextState: (c: string) => string;
    getContrastColor: (hex: string) => string;
    formatDate: (date: Date, includeTime?: boolean) => string;
    getDateClasses: (date: Date, isDeadline: boolean) => string[];
    emptyState?: React.ReactNode;

    // Phase 17 Props
    keywordDescriptions: Record<string, string>;
    scheduledColor?: string;
    deadlineColor?: string;
    scheduledKeyword?: string;
    deadlineKeyword?: string;

    // Phase 18 props
    onUpdatePriority: (task: Task, nextPriority: string | null) => void;
    onPriorityContextMenu: (task: Task, e: React.MouseEvent) => void;
    getNextPriority: (current: string | null) => string | null;
    // US-4.1: Date management
    onDateContextMenu: (task: Task, dateType: 'scheduled' | 'deadline', e: React.MouseEvent) => void;
    // Épica 5: Label management
    onLabelContextMenu: (task: Task, label: string, e: React.MouseEvent) => void;
    availableLabels?: string[];
}

export const TodoList: React.FC<TodoListProps> = (props) => {
    const { tasks, emptyState } = props;

    // Grouping Logic
    // We memoize to avoid recalculating on every render if tasks didn't change, 
    // but React.FC re-renders usually when props change anyway.
    const groupedTasks = React.useMemo(() => {
        const groups = new Map<string, Task[]>();

        tasks.forEach(task => {
            const list = groups.get(task.path) || [];
            list.push(task);
            groups.set(task.path, list);
        });

        // Convert to array and sort by filename/path
        return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [tasks]);

    if (tasks.length === 0) {
        return <div className="todo-empty">{emptyState || 'No tasks found'}</div>;
    }

    return (
        <div className="todo-list-grouped">
            {groupedTasks.map(([path, groupTasks]) => {
                // simple basename
                const title = path.split('/').pop() || path;
                return (
                    <TaskGroup
                        key={path}
                        title={title}
                        // Pass props first
                        {...props}
                        // Then override tasks for this group
                        tasks={groupTasks}
                    />
                );
            })}
        </div>
    );
};
