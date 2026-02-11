import * as React from 'react';
import { Notice } from 'obsidian';
import TodoTracker from '../../main';
import { SettingsService } from '../../services/settings-service';

interface LabelsSectionProps {
    plugin: TodoTracker;
    settingsService: SettingsService;
    onSettingsChange: () => void;
}

export const LabelsSection: React.FC<LabelsSectionProps> = ({
    plugin,
    settingsService,
    onSettingsChange,
}) => {
    const [labelMode, setLabelMode] = React.useState<'free' | 'defined'>(plugin.settings.labelMode || 'free');
    const [definedLabels, setDefinedLabels] = React.useState<string[]>(settingsService.getOrderedDefinedLabels());
    const [newLabelInput, setNewLabelInput] = React.useState('');

    const syncFromSettings = React.useCallback(() => {
        setLabelMode(settingsService.settings.labelMode || 'free');
        setDefinedLabels(settingsService.getOrderedDefinedLabels());
    }, [settingsService]);

    React.useEffect(() => {
        syncFromSettings();
    }, [plugin.settings, syncFromSettings]);

    const refreshAfterSave = () => {
        syncFromSettings();
        onSettingsChange();
    };

    const handleModeChange = async (mode: 'free' | 'defined') => {
        if (mode === labelMode) {
            return;
        }
        await settingsService.updateLabelMode(mode);
        refreshAfterSave();
    };

    const handleAddLabel = async () => {
        const added = await settingsService.upsertDefinedLabel(newLabelInput);
        if (!added) {
            new Notice('Invalid label. Use format: @Label or Label.');
            return;
        }
        setNewLabelInput('');
        refreshAfterSave();
    };

    const handleRenameLabel = async (currentLabel: string, rawValue: string) => {
        const candidate = rawValue.trim();
        if (!candidate || candidate === currentLabel) {
            syncFromSettings();
            return;
        }

        const renamed = await settingsService.renameDefinedLabel(currentLabel, candidate);
        if (!renamed) {
            new Notice('Could not rename label.');
        }
        refreshAfterSave();
    };

    const handleRemoveLabel = async (label: string) => {
        await settingsService.removeDefinedLabel(label);
        refreshAfterSave();
    };

    const handleMoveLabel = async (index: number, direction: 'up' | 'down') => {
        await settingsService.moveDefinedLabel(index, direction);
        refreshAfterSave();
    };

    const handleColorChange = async (label: string, color: string) => {
        await settingsService.setLabelColor(label, color);
        refreshAfterSave();
    };

    return (
        <div className="todo-vocab-section" style={{ marginTop: '40px' }}>
            <h3>4. Labels</h3>

            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                    Label mode
                </label>
                <select
                    value={labelMode}
                    onChange={(event) => handleModeChange(event.target.value as 'free' | 'defined')}
                    style={{
                        width: '260px',
                        padding: '6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--background-primary)',
                        border: '1px solid var(--background-modifier-border)',
                        color: 'var(--text-normal)',
                    }}
                >
                    <option value="free">Free: parse any @label</option>
                    <option value="defined">Defined: parse only registered labels</option>
                </select>
                <div style={{ marginTop: '6px', fontSize: '0.85em', color: 'var(--text-muted)' }}>
                    In defined mode, unknown labels stay as plain text.
                </div>
            </div>

            <div style={{
                maxWidth: '680px',
                backgroundColor: 'var(--background-secondary)',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--background-modifier-border)',
            }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                    <input
                        type="text"
                        value={newLabelInput}
                        placeholder="New label (e.g. Backend)"
                        onChange={(event) => setNewLabelInput(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                handleAddLabel();
                            }
                        }}
                        style={{ flex: 1 }}
                    />
                    <button onClick={handleAddLabel}>Add label</button>
                </div>

                {definedLabels.length === 0 ? (
                    <div style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                        No defined labels yet.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {definedLabels.map((label, index) => (
                            <div
                                key={`${label}-${index}`}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '40px minmax(140px, 1fr) 96px 72px',
                                    gap: '8px',
                                    alignItems: 'center',
                                }}
                            >
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        className="clickable-icon"
                                        onClick={() => handleMoveLabel(index, 'up')}
                                        disabled={index === 0}
                                        aria-label={`Move label ${label} up`}
                                        style={{ padding: '2px 6px' }}
                                    >
                                        ▲
                                    </button>
                                    <button
                                        className="clickable-icon"
                                        onClick={() => handleMoveLabel(index, 'down')}
                                        disabled={index === definedLabels.length - 1}
                                        aria-label={`Move label ${label} down`}
                                        style={{ padding: '2px 6px' }}
                                    >
                                        ▼
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    defaultValue={label}
                                    onBlur={(event) => handleRenameLabel(label, event.target.value)}
                                    aria-label={`Rename label ${label}`}
                                />

                                <input
                                    type="color"
                                    value={settingsService.getLabelColor(label)}
                                    onChange={(event) => handleColorChange(label, event.target.value)}
                                    aria-label={`Choose color for label ${label}`}
                                    style={{ width: '100%' }}
                                />

                                <button
                                    onClick={() => handleRemoveLabel(label)}
                                    aria-label={`Remove label ${label}`}
                                    style={{ backgroundColor: '#ff5555', color: 'var(--text-on-accent)' }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{
                marginTop: '10px',
                fontSize: '0.85em',
                color: 'var(--text-muted)',
                padding: '8px 10px',
                border: '1px dashed var(--background-modifier-border)',
                borderRadius: '6px',
            }}>
                Planned next: label groups and mobile-first interaction once desktop flow is validated.
            </div>
        </div>
    );
};
