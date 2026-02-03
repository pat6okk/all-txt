import * as React from 'react';
import { setIcon } from 'obsidian';
import { TaskViewMode } from '../../task';
import { SortMethod, GroupingMethod, AdvancedFilters } from '../../settings/defaults';
import { AdvancedFiltersPanel } from './AdvancedFiltersPanel';

interface TodoToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    viewMode: TaskViewMode;
    onViewModeChange: (mode: TaskViewMode) => void;
    sortMethod: SortMethod;
    onSortMethodChange: (method: SortMethod) => void;
    groupingMethod: GroupingMethod;
    onGroupingMethodChange: (method: GroupingMethod) => void;
    advancedFilters: AdvancedFilters;
    onAdvancedFiltersChange: (filters: AdvancedFilters) => void;
    filterActive: boolean;
    onFilterActiveChange: (active: boolean) => void;
    taskCount: number;
    totalCount: number;
    // Dynamic options
    availableStates?: string[];
    availablePriorities?: string[];
    availableLabels?: string[]; // Épica 5
}

export const TodoToolbar: React.FC<TodoToolbarProps> = ({
    searchQuery, onSearchChange,
    viewMode, onViewModeChange,
    sortMethod, onSortMethodChange,
    groupingMethod, onGroupingMethodChange,
    advancedFilters, onAdvancedFiltersChange,
    filterActive, onFilterActiveChange,
    taskCount, totalCount,
    availableStates = [],
    availablePriorities = [],
    availableLabels = []
}) => {

    // Refs for icons
    const sortBtnRef = React.useRef<HTMLButtonElement>(null);
    const hideBtnRef = React.useRef<HTMLButtonElement>(null);
    const filterBtnRef = React.useRef<HTMLButtonElement>(null);
    const matchCaseRef = React.useRef<HTMLDivElement>(null);

    // Effect to mount icons using Obsidian API (since they are SVG replacements)
    React.useEffect(() => {
        if (sortBtnRef.current) setIcon(sortBtnRef.current, viewMode === 'sortCompletedLast' ? 'list' : 'sort-desc'); // simplified icons for react
        if (hideBtnRef.current) setIcon(hideBtnRef.current, 'eye-off');
        if (filterBtnRef.current) setIcon(filterBtnRef.current, 'file');
        // matchCase icon is usually 'uppercase-lowercase-a'
    }, [viewMode, sortMethod]); // Re-run if mode changes

    return (
        <div className="todo-toolbar">
            <div className="todo-toolbar-first-row">
                {/* Search Input */}
                <div className="todo-toolbar-right">
                    <label className="sr-only">Search</label>
                    <div className="search-input-container global-search-input-container">
                        <input
                            type="search"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                        <div className="search-input-clear-button" aria-label="Clear search" onClick={() => onSearchChange('')}></div>
                    </div>
                </div>

                {/* Toggles Group */}
                <div className="todo-toggles-group" style={{ display: 'flex', gap: '4px', marginRight: '8px' }}>
                    <button
                        ref={filterBtnRef}
                        className={`clickable-icon todo-toggle-btn ${filterActive ? 'is-active' : ''}`}
                        aria-label="Filter by active file"
                        onClick={() => onFilterActiveChange(!filterActive)}
                    />
                </div>

                {/* Mode Icons */}
                <div className="todo-mode-icons" role="group">
                    <button
                        ref={sortBtnRef}
                        className={`clickable-icon todo-mode-icon-btn ${viewMode === 'sortCompletedLast' ? 'is-active' : ''}`}
                        aria-label={viewMode === 'sortCompletedLast' ? "Restore default order" : "Sort completed to end"}
                        onClick={() => onViewModeChange(viewMode === 'sortCompletedLast' ? 'default' : 'sortCompletedLast')}
                    />
                    <button
                        ref={hideBtnRef}
                        className={`clickable-icon todo-mode-icon-btn ${viewMode === 'hideCompleted' ? 'is-active' : ''}`}
                        aria-label="Hide completed tasks"
                        onClick={() => onViewModeChange(viewMode === 'hideCompleted' ? 'default' : 'hideCompleted')}
                    />
                </div>
            </div>

            {/* Info and Sort Row */}
            <div className="search-results-info">
                <div className="search-results-result-count">
                    {taskCount} of {totalCount} tasks
                </div>
                <select
                    className="dropdown"
                    value={sortMethod}
                    onChange={(e) => onSortMethodChange(e.target.value as SortMethod)}
                >
                    <option value="default">Default (file path)</option>
                    <option value="sortByScheduled">Scheduled date</option>
                    <option value="sortByDeadline">Deadline date</option>
                    <option value="sortByPriority">Priority</option>
                </select>
                <select
                    className="dropdown"
                    value={groupingMethod}
                    onChange={(e) => onGroupingMethodChange(e.target.value as GroupingMethod)}
                >
                    <option value="none">No grouping</option>
                    <option value="byState">Group by state</option>
                    <option value="byFile">Group by file</option>
                </select>
            </div>

            {/* Advanced Filters Panel */}
            <AdvancedFiltersPanel
                filters={advancedFilters}
                onChange={onAdvancedFiltersChange}
                availableStates={availableStates}
                availablePriorities={availablePriorities}
                availableLabels={availableLabels}
            />
        </div>
    );
};
