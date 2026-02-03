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
    // US-4.1: Date management
    onDateContextMenu: (task: Task, dateType: 'scheduled' | 'deadline', e: React.MouseEvent) => void;
    // Épica 5: Label management
    onLabelContextMenu: (task: Task, label: string, e: React.MouseEvent) => void;
    availableLabels?: string[];
}

export const TaskItem: React.FC<TaskItemProps> = ({
    task, getKeywordColor, onUpdateState, onToggle, onOpenTask, onContextMenu,
    getContrastColor, getNextState, formatDate, getDateClasses,
    keywordDescriptions, scheduledColor, deadlineColor, scheduledKeyword, deadlineKeyword,
    onUpdatePriority, onPriorityContextMenu, getNextPriority,
    onDateContextMenu, onLabelContextMenu, availableLabels
}) => {
    // State for expanding/collapsing block content
    const [expanded, setExpanded] = React.useState(true);

    // Only show expander if there are actual subtasks OR non-empty text content
    const hasRealTextContent = task.blockContent && task.blockContent.some(line => line.trim().length > 0);
    const hasBlockContent = (task.subtasks && task.subtasks.length > 0) || hasRealTextContent;

    const color = getKeywordColor(task.state);
    const contrast = getContrastColor(color);

    const handleKeywordClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const next = getNextState(task.state);
        onUpdateState(task, next);
    };

    const handlePriorityClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onOpenTask(task, e);
    };

    const handlePriorityContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onPriorityContextMenu(task, e);
    };

    // Toggle expand/collapse
    const handleToggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded(!expanded);
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
            // Prevent opening file if clicking badge or checkbox or priority or expander
            if (target.tagName !== 'INPUT' &&
                !target.classList.contains('todo-keyword') &&
                !target.classList.contains('priority-badge') &&
                !target.classList.contains('todo-expander') &&
                !target.classList.contains('clickable-icon')) {
                onOpenTask(task, e);
            }
        }}>
            {/* Main Row: Expander, Checkbox, Status, Priority, Text */}
            <div className="todo-main-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>

                {/* Expander Icon */}
                <div
                    className={`todo-expander ${hasBlockContent ? 'has-content' : ''}`}
                    style={{
                        marginTop: '6px',
                        cursor: hasBlockContent ? 'pointer' : 'default',
                        opacity: hasBlockContent ? 1 : 0, // Fully invisible if no content
                        pointerEvents: hasBlockContent ? 'auto' : 'none',
                        width: '12px', // Fixed width to keep alignment
                        flexShrink: 0,
                        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease'
                    }}
                    onClick={hasBlockContent ? handleToggleExpand : undefined}
                >
                    <svg viewBox="0 0 100 100" className="right-triangle" width="10" height="10" fill="var(--text-normal)">
                        <path d="M 30,20 L 80,50 L 30,80 Z" />
                    </svg>
                </div>

                {/* Removed Redundant Checkbox - The Keyword is the status indicator now */}

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

                    {/* Labels - Épica 5 */}
                    {task.labels && task.labels.length > 0 && task.labels.map((label, idx) => (
                        <span
                            key={`${label}-${idx}`}
                            className="label-badge"
                            role="button"
                            style={{
                                backgroundColor: '#BD93F9',
                                color: 'white',
                                marginRight: '4px',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                fontSize: '0.7em',
                                fontWeight: 500,
                                cursor: 'pointer'
                            }}
                            title={`Right-click for options`}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onLabelContextMenu(task, label, e);
                            }}
                        >
                            @{label}
                        </span>
                    ))}

                    <span
                        className="todo-text-content"
                        dangerouslySetInnerHTML={{ __html: task.text }}
                    />

                    {/* Meta Row: Dates - ALWAYS Visible if they exist */}
                    {(task.scheduledDate || task.deadlineDate) && (
                        <div className="todo-meta-row" style={{ marginTop: '4px', fontSize: '0.85em', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                            {task.scheduledDate && (
                                <span
                                    className={`todo-date-item ${getDateClasses(task.scheduledDate, false).join(' ')}`}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDateContextMenu(task, 'scheduled', e);
                                    }}
                                    style={{ cursor: 'context-menu' }}
                                >
                                    <span style={{ fontWeight: 600, color: scheduledColor }}>
                                        {task.scheduledSymbol || scheduledKeyword || 'SCHEDULED'}:
                                    </span>
                                    {' '}{formatDate(task.scheduledDate)}
                                </span>
                            )}
                            {task.deadlineDate && (
                                <span
                                    className={`todo-date-item ${getDateClasses(task.deadlineDate, true).join(' ')}`}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onDateContextMenu(task, 'deadline', e);
                                    }}
                                    style={{ cursor: 'context-menu' }}
                                >
                                    <span style={{ fontWeight: 600, color: deadlineColor }}>
                                        {task.deadlineSymbol || deadlineKeyword || 'DEADLINE'}:
                                    </span>
                                    {' '}{formatDate(task.deadlineDate)}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Expanded Block Content */}
                    {expanded && hasBlockContent && (
                        <div className="todo-block-content" style={{ marginTop: '8px', paddingLeft: '4px', borderLeft: '2px solid var(--background-modifier-border)' }}>
                            {/* Notes/Block text */}
                            <div className="todo-notes" style={{
                                color: 'var(--text-muted)',
                                fontSize: '0.9em',
                                whiteSpace: 'pre-wrap',
                                marginBottom: '8px'
                            }}>
                                {task.blockContent?.filter(line => !line.trim().startsWith('- [') && !line.trim().startsWith('* [') && !line.trim().startsWith('+ [')).join('\n')}
                            </div>

                            {/* Subtasks */}
                            {task.subtasks && task.subtasks.length > 0 && (
                                <ul className="todo-subtasks" style={{ listStyle: 'none', paddingLeft: '0', margin: '0' }}>
                                    {task.subtasks.map((sub, idx) => (
                                        <li key={idx} style={{
                                            display: 'flex',
                                            alignItems: 'baseline',
                                            gap: '6px',
                                            marginBottom: '4px',
                                            textDecoration: sub.completed ? 'line-through' : 'none',
                                            opacity: sub.completed ? 0.6 : 1
                                        }}>
                                            <input type="checkbox" checked={sub.completed} disabled style={{ marginTop: '2px' }} />
                                            <span>{sub.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </span>
            </div>
        </li>
    );
};
