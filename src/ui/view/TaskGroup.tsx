import * as React from 'react';
import { Task } from '../../task';
import { TaskItem } from './TaskItem';

// Define the Props interface based on what TaskItem needs
// We can reuse a subset of TodoListProps logic or just redefine
interface TaskGroupProps {
    title: string;
    tasks: Task[];
    // All action props needed for TaskItem
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

    keywordDescriptions: Record<string, string>;
    scheduledColor?: string;
    deadlineColor?: string;
    scheduledKeyword?: string;
    deadlineKeyword?: string;

    onUpdatePriority: (task: Task, nextPriority: string | null) => void;
    onPriorityContextMenu: (task: Task, e: React.MouseEvent) => void;
    getNextPriority: (current: string | null) => string | null;
    // US-4.1: Date management
    onDateContextMenu: (task: Task, dateType: 'scheduled' | 'deadline', e: React.MouseEvent) => void;
    // Épica 5: Label management
    onLabelContextMenu: (task: Task, label: string, e: React.MouseEvent) => void;
    availableLabels?: string[];
}

export const TaskGroup: React.FC<TaskGroupProps> = (props) => {
    const [collapsed, setCollapsed] = React.useState(false);

    const toggle = () => setCollapsed(!collapsed);

    return (
        <div className="todo-group">
            <div
                className="todo-group-header"
                onClick={toggle}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    backgroundColor: 'var(--background-secondary)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontWeight: 600,
                    fontSize: '0.9em',
                    borderBottom: '1px solid var(--background-modifier-border)'
                }}
            >
                <span
                    className="todo-group-icon"
                    style={{ marginRight: '6px', fontSize: '0.8em', transition: 'transform 0.2s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                >
                    ▼
                </span>
                <span className="todo-group-title">{props.title}</span>
                <span className="todo-group-count" style={{ marginLeft: 'auto', fontSize: '0.8em', color: 'var(--text-muted)' }}>
                    {props.tasks.length}
                </span>
            </div>

            {!collapsed && (
                <ul className="todo-list">
                    {props.tasks.map(task => (
                        <TaskItem
                            key={`${task.path}:${task.line}`}
                            task={task}
                            // Pass through all props
                            onUpdateState={props.onUpdateState}
                            onToggle={props.onToggle}
                            onOpenTask={props.onOpenTask}
                            onContextMenu={props.onContextMenu}
                            getKeywordColor={props.getKeywordColor}
                            getLabelColor={props.getLabelColor}
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
                            onLabelContextMenu={props.onLabelContextMenu}
                            availableLabels={props.availableLabels}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
};
