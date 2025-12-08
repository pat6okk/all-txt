import * as React from 'react';
import { Task } from '../../task';
import { setIcon } from 'obsidian';

interface TaskItemProps {
    task: Task;
    getKeywordColor: (k: string) => string;
    onUpdateState: (task: Task, nextState: string) => void;
    onToggle: (task: Task) => void;
    onOpenTask: (task: Task, e: React.MouseEvent) => void;
    onContextMenu: (task: Task, e: React.MouseEvent) => void;

    // Helper to calculate contrast color
    getContrastColor: (hex: string) => string;
    // Helper to get next state (usually passed from parent/service)
    getNextState: (current: string) => string;

    // Date Helpers
    formatDate: (date: Date, includeTime?: boolean) => string;
    getDateClasses: (date: Date, isDeadline: boolean) => string[];
    // Data
    keywordDescriptions: Record<string, string>;
    scheduledColor?: string;
    deadlineColor?: string;

    // Phase 17b
    scheduledKeyword?: string;
    deadlineKeyword?: string;
    // Phase 18
    onUpdatePriority: (task: Task, nextPriority: string | null) => void;
    onPriorityContextMenu: (task: Task, e: React.MouseEvent) => void;
    getNextPriority: (current: string | null) => string | null;
}

export const TaskItem: React.FC<TaskItemProps> = ({
    task, getKeywordColor, onUpdateState, onToggle, onOpenTask, onContextMenu,
    getContrastColor, getNextState, formatDate, getDateClasses,
    keywordDescriptions, scheduledColor, deadlineColor, scheduledKeyword, deadlineKeyword,
    onUpdatePriority, onPriorityContextMenu, getNextPriority
}) => {

    const color = getKeywordColor(task.state);
    const contrast = getContrastColor(color);

    const handleKeywordClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = getNextState(task.state);
        onUpdateState(task, next);
    };

    const handlePriorityClick = (e: React.MouseEvent) => {
        // Phase 21: Clicking priority no longer cycles, but prevents opening file
        e.stopPropagation();
        // Option: Select the task line?
        onOpenTask(task, e);
    };

    const handlePriorityContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onPriorityContextMenu(task, e);
    };

    // Robust priority color lookup
    const getPriorityColor = (p: string) => {
        let c = getKeywordColor(p);
        if (c === '#888888' && !p.startsWith('#')) {
            c = getKeywordColor('#' + p);
        }
        return c;
    };

    return (
        <li className="todo-item" data-path={task.path} data-line={task.line} onClick={(e) => {
            const target = e.target as HTMLElement;
            // Prevent opening file if clicking badge or checkbox or priority
            if (target.tagName !== 'INPUT' && !target.classList.contains('todo-keyword') && !target.classList.contains('priority-badge') && !target.classList.contains('clickable-icon')) {
                onOpenTask(task, e);
            }
        }}>
            {/* Main Row: Checkbox, Status, Priority, Text */}
            <div className="todo-main-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <input
                    type="checkbox"
                    className="todo-checkbox"
                    checked={task.completed}
                    onChange={() => onToggle(task)}
                    style={{ marginTop: '4px' }}
                />

                <span className="todo-content" style={{ flex: 1, overflow: 'hidden' }}>
                    <span
                        className="todo-keyword"
                        role="button"
                        tabIndex={0}
                        aria-checked={task.completed}
                        title={keywordDescriptions[task.state] || task.state}
                        style={{
                            backgroundColor: color,
                            color: contrast,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            fontSize: '0.8em',
                            fontWeight: 'bold',
                            marginRight: '6px',
                            verticalAlign: 'text-bottom',
                            cursor: 'pointer'
                        }}
                        onClick={handleKeywordClick}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            onContextMenu(task, e);
                        }}
                    >
                        {task.state}
                    </span>

                    {task.priority && (
                        <span
                            className="priority-badge"
                            role="button"
                            style={{
                                backgroundColor: getPriorityColor(task.priority),
                                color: getContrastColor(getPriorityColor(task.priority)),
                                marginRight: '6px',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                fontSize: '0.75em',
                                cursor: 'pointer'
                            }}
                            onClick={handlePriorityClick}
                            onContextMenu={handlePriorityContextMenu}
                            title="Right-click to select priority"
                        >
                            {task.priority}
                        </span>
                    )}

                    <span
                        className="todo-text-content"
                        dangerouslySetInnerHTML={{ __html: task.text }}
                    />

                    {/* Meta Row: Dates (Below text, indented slightly or block) */}
                    {((task.scheduledDate || task.deadlineDate) && !task.completed) && (
                        <div className="todo-meta-row" style={{ marginTop: '4px', fontSize: '0.85em', color: 'var(--text-muted)' }}>
                            {task.scheduledDate && (
                                <span className={`todo-date-item ${getDateClasses(task.scheduledDate, false).join(' ')}`} style={{ marginRight: '12px' }}>
                                    <span style={{ fontWeight: 600, color: scheduledColor }}>
                                        {task.scheduledSymbol || scheduledKeyword || 'SCHEDULED'}:
                                    </span>
                                    {' '}{formatDate(task.scheduledDate)}
                                </span>
                            )}
                            {task.deadlineDate && (
                                <span className={`todo-date-item ${getDateClasses(task.deadlineDate, true).join(' ')}`}>
                                    <span style={{ fontWeight: 600, color: deadlineColor }}>
                                        {task.deadlineSymbol || deadlineKeyword || 'DEADLINE'}:
                                    </span>
                                    {' '}{formatDate(task.deadlineDate)}
                                </span>
                            )}
                        </div>
                    )}
                </span>
            </div>
        </li>
    );
};
