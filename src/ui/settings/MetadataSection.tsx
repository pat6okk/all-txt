import * as React from 'react';
import TodoTracker from '../../main';
import { KeywordList } from './KeywordList';
import { KeywordEditModal } from '../../settings/keyword-modal';
import { SettingsService } from '../../services/settings-service';

interface MetadataSectionProps {
    plugin: TodoTracker;
    settingsService: SettingsService;
    onSettingsChange: () => void;
}

export const MetadataSection: React.FC<MetadataSectionProps> = ({ plugin, settingsService, onSettingsChange }) => {
    // We use a local state that syncs with plugin settings on mount
    const [scheduledKeywords, setScheduledKeywords] = React.useState(plugin.settings.scheduledKeywords);
    const [deadlineKeywords, setDeadlineKeywords] = React.useState(plugin.settings.deadlineKeywords);
    // Priority queues is an array of arrays.
    const [priorityQueues, setPriorityQueues] = React.useState(plugin.settings.priorityQueues);

    // Sync state
    React.useEffect(() => {
        setScheduledKeywords(plugin.settings.scheduledKeywords);
        setDeadlineKeywords(plugin.settings.deadlineKeywords);
        setPriorityQueues(plugin.settings.priorityQueues);
    }, [plugin.settings]);

    const updateScheduled = async (nw: string[], oldK?: string) => {
        await settingsService.updateDateKeywords('scheduledKeywords', nw, oldK);
        setScheduledKeywords([...settingsService.settings.scheduledKeywords]);
        onSettingsChange();
    };

    const updateDeadline = async (nw: string[], oldK?: string) => {
        await settingsService.updateDateKeywords('deadlineKeywords', nw, oldK);
        setDeadlineKeywords([...settingsService.settings.deadlineKeywords]);
        onSettingsChange();
    };

    const updatePriorityGroup = async (groupIdx: number, newKeywords: string[], oldK?: string) => {
        await settingsService.updatePriorityGroup(groupIdx, newKeywords, oldK);
        setPriorityQueues([...settingsService.settings.priorityQueues]);
        onSettingsChange();
    };

    const deletePriorityGroup = async (groupIdx: number) => {
        if (confirm('Delete this priority group?')) {
            await settingsService.deletePriorityGroup(groupIdx);
            setPriorityQueues([...settingsService.settings.priorityQueues]);
            onSettingsChange();
        }
    };

    const addPriorityGroup = async () => {
        await settingsService.addPriorityGroup();
        setPriorityQueues([...settingsService.settings.priorityQueues]);
        onSettingsChange();
    };

    const getKeywordColor = (k: string) => settingsService.getKeywordColor(k);

    const handleEdit = (k: string) => {
        new KeywordEditModal(plugin.app, k, getKeywordColor(k), settingsService.getKeywordDescription(k), async (res) => {
            await settingsService.updateKeywordMetadata(k, res.color, res.description);
            // Force re-render via parent
            onSettingsChange();
        }).open();
    };

    const handleResetDates = async () => {
        if (!confirm('Reset Date Keywords (Scheduled/Deadline) to defaults?')) return;

        await settingsService.resetDateKeywords();
        setScheduledKeywords([...settingsService.settings.scheduledKeywords]);
        setDeadlineKeywords([...settingsService.settings.deadlineKeywords]);
        onSettingsChange();
    };

    const handleResetPriorities = async () => {
        if (!confirm('Reset Priority Groups to defaults?')) return;

        await settingsService.resetPriorities();
        setPriorityQueues([...settingsService.settings.priorityQueues]);
        onSettingsChange();
    };


    return (
        <div className="todo-vocab-section" style={{ marginTop: '40px' }}>
            <h3>3. Metadata (Dates & Priority)</h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4>Date Keywords</h4>
                <button
                    onClick={handleResetDates}
                    style={{ fontSize: '0.8em', padding: '2px 8px', height: 'auto', opacity: 0.8 }}
                    title="Reset Date Keywords to Defaults"
                >
                    Reset Defaults
                </button>
            </div>
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', marginBottom: '20px' }}>
                <KeywordList
                    title="Scheduled"
                    keywords={scheduledKeywords}
                    onUpdate={(nw, oldK) => updateScheduled(nw, oldK)}
                    getKeywordColor={getKeywordColor}
                    onEdit={handleEdit}
                    onDelete={(i) => {
                        const n = [...scheduledKeywords]; n.splice(i, 1); updateScheduled(n);
                    }}
                    placeholder="PREFIX"
                />
                <KeywordList
                    title="Deadline"
                    keywords={deadlineKeywords}
                    onUpdate={(nw, oldK) => updateDeadline(nw, oldK)}
                    getKeywordColor={getKeywordColor}
                    onEdit={handleEdit}
                    onDelete={(i) => {
                        const n = [...deadlineKeywords]; n.splice(i, 1); updateDeadline(n);
                    }}
                    placeholder="PREFIX"
                />
            </div>

            <div style={{ padding: '10px', backgroundColor: 'var(--background-secondary-alt)', borderRadius: '6px', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                <strong>How to use Date Keywords:</strong>
                <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                    <li>Place date keyword and value on the line immediately following the task.</li>
                    <li>Flexible Date Formats: DD/MM/YYYY, YYYY-MM-DD, MM-DD-YYYY (no delimiters required)</li>
                    <li>Natural language also supported: "tomorrow", "next Friday"</li>
                </ul>
            </div>

            {/* US-4.1: Date Format Selector */}
            <div style={{ marginTop: '15px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                    Date Format Preference
                </label>
                <select
                    value={plugin.settings.dateFormat}
                    onChange={async (e) => {
                        const newFormat = e.target.value as 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM-DD-YYYY';
                        await settingsService.updateSetting('dateFormat', newFormat);
                        onSettingsChange();
                    }}
                    style={{
                        width: '250px',
                        padding: '6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--background-primary)',
                        border: '1px solid var(--background-modifier-border)',
                        color: 'var(--text-normal)'
                    }}
                >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (European)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard)</option>
                    <option value="MM-DD-YYYY">MM-DD-YYYY (American)</option>
                </select>
                <div style={{ marginTop: '6px', fontSize: '0.85em', color: 'var(--text-muted)' }}>
                    Preview: <span style={{ fontFamily: 'var(--font-monospace)' }}>
                        {plugin.settings.dateFormat === 'DD/MM/YYYY' && '25/12/2025'}
                        {plugin.settings.dateFormat === 'YYYY-MM-DD' && '2025-12-25'}
                        {plugin.settings.dateFormat === 'MM-DD-YYYY' && '12-25-2025'}
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
                <h4 style={{ margin: 0 }}>Priority Markers</h4>
                <button
                    onClick={handleResetPriorities}
                    style={{ fontSize: '0.8em', padding: '2px 8px', height: 'auto', opacity: 0.8 }}
                    title="Reset Priorities to Defaults"
                >
                    Reset Defaults
                </button>
            </div>

            <div style={{ maxWidth: '400px', backgroundColor: 'var(--background-secondary)', padding: '15px', borderRadius: '8px', border: '1px solid var(--background-modifier-border)', marginTop: '10px' }}>
                {priorityQueues.map((queue, qIdx) => (
                    <div key={qIdx} className="vocab-group" style={{ marginBottom: '15px', padding: '10px', backgroundColor: 'var(--background-primary)', borderRadius: '6px', border: '1px solid var(--background-modifier-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span className="priority-group-label">Group {qIdx + 1}</span>
                            <button style={{ padding: '0 6px', height: '20px' }} onClick={() => deletePriorityGroup(qIdx)}>×</button>
                        </div>
                        <KeywordList
                            title=""
                            keywords={queue}
                            onUpdate={(nw, oldK) => updatePriorityGroup(qIdx, nw, oldK)}
                            getKeywordColor={getKeywordColor}
                            onEdit={handleEdit}
                            onDelete={(i) => {
                                const n = [...queue]; n.splice(i, 1); updatePriorityGroup(qIdx, n);
                            }}
                            placeholder="TOKEN"
                        />
                    </div>
                ))}
                <button style={{ width: '100%' }} onClick={addPriorityGroup}>+ Add New Priority Group</button>
            </div>
        </div>
    );
};
