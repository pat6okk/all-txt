import * as React from 'react';
import { AdvancedFilters, DateFilterMode } from '../../settings/defaults';

interface AdvancedFiltersPanelProps {
    filters: AdvancedFilters;
    onChange: (filters: AdvancedFilters) => void;
    // Available options
    availableStates: string[];
    availablePriorities: string[];
    availableLabels: string[]; // Épica 5
}

export const AdvancedFiltersPanel: React.FC<AdvancedFiltersPanelProps> = ({
    filters,
    onChange,
    availableStates,
    availablePriorities,
    availableLabels
}) => {
    const [expanded, setExpanded] = React.useState(false);

    const toggleState = (state: string) => {
        const newStates = filters.states.includes(state)
            ? filters.states.filter(s => s !== state)
            : [...filters.states, state];
        onChange({ ...filters, states: newStates });
    };

    const togglePriority = (priority: string) => {
        const newPriorities = filters.priorities.includes(priority)
            ? filters.priorities.filter(p => p !== priority)
            : [...filters.priorities, priority];
        onChange({ ...filters, priorities: newPriorities });
    };

    const setDateMode = (mode: DateFilterMode) => {
        onChange({ ...filters, dateMode: mode });
    };

    // Épica 5: Toggle label filter
    const toggleLabel = (label: string) => {
        const currentLabels = filters.labels || [];
        const newLabels = currentLabels.includes(label)
            ? currentLabels.filter(l => l !== label)
            : [...currentLabels, label];
        onChange({ ...filters, labels: newLabels });
    };

    const clearAll = () => {
        onChange({ states: [], priorities: [], labels: [], dateMode: 'all' });
    };

    const hasActiveFilters = filters.states.length > 0 ||
        filters.priorities.length > 0 ||
        (filters.labels && filters.labels.length > 0) ||
        filters.dateMode !== 'all';

    return (
        <div className="advanced-filters-panel">
            <div
                className="advanced-filters-header"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    borderBottom: expanded ? '1px solid var(--background-modifier-border)' : 'none'
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <svg
                    viewBox="0 0 100 100"
                    width="10"
                    height="10"
                    fill="var(--text-muted)"
                    style={{
                        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.15s ease',
                        marginRight: '6px'
                    }}
                >
                    <path d="M 30,20 L 80,50 L 30,80 Z" />
                </svg>
                <span style={{ fontWeight: 500, color: 'var(--text-normal)' }}>
                    Advanced Filters
                </span>
                {hasActiveFilters && (
                    <span
                        style={{
                            marginLeft: '8px',
                            fontSize: '0.75em',
                            color: 'var(--text-accent)',
                            fontWeight: 'bold'
                        }}
                    >
                        ●
                    </span>
                )}
                {hasActiveFilters && (
                    <button
                        className="clickable-icon"
                        style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: '0.8em' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            clearAll();
                        }}
                        aria-label="Clear all filters"
                    >
                        Clear
                    </button>
                )}
            </div>

            {expanded && (
                <div className="advanced-filters-content" style={{ padding: '8px' }}>
                    {/* States Filter */}
                    <div className="filter-section" style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.85em', fontWeight: 600, marginBottom: '4px', color: 'var(--text-muted)' }}>
                            States:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {availableStates.map(state => (
                                <button
                                    key={state}
                                    className={`filter-chip ${filters.states.includes(state) ? 'is-active' : ''}`}
                                    style={{
                                        padding: '2px 8px',
                                        fontSize: '0.8em',
                                        borderRadius: '3px',
                                        border: '1px solid var(--background-modifier-border)',
                                        backgroundColor: filters.states.includes(state) ? 'var(--interactive-accent)' : 'var(--background-secondary)',
                                        color: filters.states.includes(state) ? 'var(--text-on-accent)' : 'var(--text-normal)',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => toggleState(state)}
                                >
                                    {state}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Priorities Filter */}
                    {availablePriorities.length > 0 && (
                        <div className="filter-section" style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '0.85em', fontWeight: 600, marginBottom: '4px', color: 'var(--text-muted)' }}>
                                Priorities:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {availablePriorities.map(priority => (
                                    <button
                                        key={priority}
                                        className={`filter-chip ${filters.priorities.includes(priority) ? 'is-active' : ''}`}
                                        style={{
                                            padding: '2px 8px',
                                            fontSize: '0.8em',
                                            borderRadius: '3px',
                                            border: '1px solid var(--background-modifier-border)',
                                            backgroundColor: filters.priorities.includes(priority) ? 'var(--interactive-accent)' : 'var(--background-secondary)',
                                            color: filters.priorities.includes(priority) ? 'var(--text-on-accent)' : 'var(--text-normal)',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => togglePriority(priority)}
                                    >
                                        {priority}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Labels Filter - Épica 5 */}
                    {availableLabels.length > 0 && (
                        <div className="filter-section" style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '0.85em', fontWeight: 600, marginBottom: '4px', color: 'var(--text-muted)' }}>
                                Labels:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {availableLabels.map(label => {
                                    const isActive = (filters.labels || []).includes(label);
                                    return (
                                        <button
                                            key={label}
                                            className={`filter-chip ${isActive ? 'is-active' : ''}`}
                                            style={{
                                                padding: '2px 8px',
                                                fontSize: '0.8em',
                                                borderRadius: '10px',
                                                border: '1px solid var(--background-modifier-border)',
                                                backgroundColor: isActive ? '#BD93F9' : 'var(--background-secondary)',
                                                color: isActive ? 'white' : 'var(--text-normal)',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => toggleLabel(label)}
                                        >
                                            @{label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Date Filter */}
                    <div className="filter-section">
                        <div style={{ fontSize: '0.85em', fontWeight: 600, marginBottom: '4px', color: 'var(--text-muted)' }}>
                            Date:
                        </div>
                        <select
                            className="dropdown"
                            value={filters.dateMode}
                            onChange={(e) => setDateMode(e.target.value as DateFilterMode)}
                            style={{ width: '100%' }}
                        >
                            <option value="all">All dates</option>
                            <option value="overdue">Overdue</option>
                            <option value="today">Today</option>
                            <option value="thisWeek">This week</option>
                            <option value="noDate">No date</option>
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
};
