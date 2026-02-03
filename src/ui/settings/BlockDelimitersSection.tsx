import * as React from 'react';
import FlowTxtPlugin from '../../main';
import { SettingsService } from '../../services/settings-service';
import { KeywordEditModal } from '../../settings/keyword-modal';
import { Setting, setIcon } from 'obsidian';

interface BlockDelimitersSectionProps {
    plugin: FlowTxtPlugin;
    settingsService: SettingsService;
    onSettingsChange: () => void;
}

export const BlockDelimitersSection: React.FC<BlockDelimitersSectionProps> = ({ plugin, settingsService, onSettingsChange }) => {

    const [settings, setSettings] = React.useState(plugin.settings);

    // Sync effect
    React.useEffect(() => {
        setSettings(plugin.settings);
    }, [plugin.settings]);

    // Active Delimiter Logic
    // We enforce single choice, so we take the first element of blockKeywords
    const activeDelimiter = settings.blockKeywords && settings.blockKeywords.length > 0
        ? settings.blockKeywords[0]
        : (settings.blockDelimiterPresets[0] || 'END-FLOW');

    const presets = settings.blockDelimiterPresets || [];

    // Check if active is in presets (it should be, if we manage it correctly)
    const isUnknown = !presets.includes(activeDelimiter);

    const currentColor = settingsService.getKeywordColor(activeDelimiter);
    const contrastColor = settingsService.getContrastColor(currentColor);

    const refresh = () => {
        setSettings({ ...settingsService.settings });
        onSettingsChange();
    };

    const handlePresetChange = async (newValue: string) => {
        if (newValue === 'create_new') {
            handleCreateNew();
            return;
        }
        // Set as active
        await settingsService.updateVocabulary('blockKeywords', [newValue]);
        refresh();
    };

    const handleCreateNew = () => {
        // Open modal with a placeholder
        new KeywordEditModal(
            plugin.app,
            "MY-BLOCK",
            "#6272A4",
            "Custom block delimiter",
            async (res) => {
                // 1. Add to presets
                await settingsService.addBlockPreset(res.newName);

                // 2. Set metadata
                await settingsService.updateKeywordMetadata(res.newName, res.color, res.description);

                // 3. Set as active
                await settingsService.updateVocabulary('blockKeywords', [res.newName]);

                refresh();
            }
        ).open();
    };

    const handleEditCurrent = () => {
        new KeywordEditModal(
            plugin.app,
            activeDelimiter,
            currentColor,
            settingsService.getKeywordDescription(activeDelimiter),
            async (res) => {
                // If name changed, specific logic:
                if (res.newName !== activeDelimiter) {
                    // Update preset list: remove old, add new
                    await settingsService.deleteBlockPreset(activeDelimiter);
                    await settingsService.addBlockPreset(res.newName);

                    // Switch active
                    await settingsService.updateVocabulary('blockKeywords', [res.newName], activeDelimiter);
                }

                // Update Metadata
                await settingsService.updateKeywordMetadata(res.newName, res.color, res.description);
                refresh();
            }
        ).open();
    };

    const handleDeleteCurrent = async () => {
        if (presets.length <= 1) {
            alert("You must have at least one delimiter preset.");
            return;
        }
        if (confirm(`Delete preset '${activeDelimiter}'?`)) {
            await settingsService.deleteBlockPreset(activeDelimiter);
            refresh();
        }
    };

    const handleReset = async () => {
        if (confirm("Reset Block Delimiters to defaults? This will remove custom presets.")) {
            await settingsService.resetBlockPresets();
            refresh();
        }
    }

    return (
        <div className="todo-settings-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="todo-settings-header" style={{ margin: 0 }}>3. Block Delimiters</h3>
                <button onClick={handleReset} style={{ fontSize: '0.8em', cursor: 'pointer' }}>Reset Defaults</button>
            </div>

            <div className="todo-settings-info-box" style={{ marginBottom: '20px', marginTop: '10px' }}>
                <p>
                    <strong>Captured Blocks:</strong> FLOW-txt captura todo el contenido (texto, listas, imágenes) debajo de una tarea hasta encontrar la siguiente tarea o un <strong>Delimitador</strong>.
                </p>
                <div style={{
                    background: 'var(--background-primary)',
                    padding: '10px',
                    borderRadius: '5px',
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                    borderLeft: '3px solid var(--interactive-accent)'
                }}>
                    TODO Mañana <br />
                    - Paso 1 <br />
                    - Paso 2 <br />
                    <span style={{ color: currentColor, fontWeight: 'bold' }}>{activeDelimiter}</span>
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}> {'<-- Cierra el bloque aquí'}</span>
                    <br /><br />
                    Texto normal fuera del flujo...
                </div>
            </div>

            <div className="setting-item">
                <div className="setting-item-info">
                    <div className="setting-item-name">Active Delimiter</div>
                    <div className="setting-item-description">
                        Selecciona el delimitador activo o crea uno nuevo.
                    </div>
                </div>
                <div className="setting-item-control" style={{ gap: '10px' }}>

                    {/* DROPDOWN */}
                    <select
                        className="dropdown"
                        value={isUnknown ? '' : activeDelimiter}
                        onChange={(e) => handlePresetChange(e.target.value)}
                    >
                        {presets.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                        <option disabled>──────────</option>
                        <option value="create_new">➕ Create New Preset...</option>
                    </select>

                    {/* EDIT BUTTON (Chip) */}
                    <div
                        onClick={handleEditCurrent}
                        className="todo-keyword-badge"
                        style={{
                            backgroundColor: currentColor,
                            color: contrastColor,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            border: '1px solid var(--background-modifier-border)',
                            minWidth: '80px',
                            justifyContent: 'center'
                        }}
                        title="Click to edit text and color"
                    >
                        {activeDelimiter}
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>✎</span>
                    </div>

                    {/* DELETE BUTTON */}
                    <button
                        onClick={handleDeleteCurrent}
                        className="clickable-icon"
                        title="Delete current preset"
                        style={{
                            color: 'var(--text-muted)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            marginLeft: '5px'
                        }}
                    >
                        <svg viewBox="0 0 100 100" className="trash-icon" width="16" height="16" fill="currentColor">
                            <path d="M 40,20 L 60,20 L 60,10 L 40,10 Z M 20,30 L 80,30 L 80,90 L 20,90 Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};
