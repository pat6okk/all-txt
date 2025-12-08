import * as React from 'react';
import TodoTracker from '../../main';
import { KeywordList } from './KeywordList';
import { KeywordEditModal } from '../../settings/keyword-modal';
import { SettingsService } from '../../services/settings-service';

interface VocabularySectionProps {
    plugin: TodoTracker;
    settingsService: SettingsService;
    onSettingsChange: () => void;
}

export const VocabularySection: React.FC<VocabularySectionProps> = ({ plugin, settingsService, onSettingsChange }) => {
    // We only need to trigger re-renders, the data comes from settingsService.settings
    const [settings, setSettings] = React.useState(plugin.settings);

    // Sync effect
    React.useEffect(() => {
        setSettings(plugin.settings);
    }, [plugin.settings]);

    const handleUpdate = async (key: 'todoKeywords' | 'doingKeywords' | 'doneKeywords', newKeywords: string[], oldKeyword?: string) => {
        await settingsService.updateVocabulary(key, newKeywords, oldKeyword);
        setSettings({ ...settingsService.settings });
        onSettingsChange();
    };

    const getKeywordColor = (k: string) => {
        return settingsService.getKeywordColor(k);
    };

    const handleEdit = (k: string) => {
        new KeywordEditModal(plugin.app, k, getKeywordColor(k), settingsService.getKeywordDescription(k), async (res) => {
            await settingsService.updateKeywordMetadata(k, res.color, res.description);
            setSettings({ ...settingsService.settings });
            onSettingsChange();
        }).open();
    };

    const handleDelete = async (key: 'todoKeywords' | 'doingKeywords' | 'doneKeywords', idx: number) => {
        const k = plugin.settings[key][idx];
        if (confirm(`Delete '${k}'?`)) {
            await settingsService.deleteKeywordFromVocabulary(key, idx);
            setSettings({ ...settingsService.settings });
            onSettingsChange();
        }
    };

    const handleReset = async () => {
        if (!confirm('Reset Vocabulary (Start/In-Progress/Finished) to defaults?')) return;

        await settingsService.resetVocabulary();
        setSettings({ ...settingsService.settings });
        onSettingsChange();
    };

    return (
        <div className="todo-vocab-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>1. Keywords (Vocabulary)</h3>
                <button
                    onClick={handleReset}
                    style={{ fontSize: '0.8em', padding: '2px 8px', height: 'auto', opacity: 0.8 }}
                    title="Reset Vocabulary to Defaults"
                >
                    Reset Defaults
                </button>
            </div>
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto' }}>
                <KeywordList
                    title="Start States"
                    keywords={settings.todoKeywords}
                    onUpdate={(nw, oldK) => handleUpdate('todoKeywords', nw, oldK)}
                    getKeywordColor={getKeywordColor}
                    onEdit={handleEdit}
                    onDelete={(i) => handleDelete('todoKeywords', i)}
                />
                <KeywordList
                    title="In-Progress"
                    keywords={settings.doingKeywords}
                    onUpdate={(nw, oldK) => handleUpdate('doingKeywords', nw, oldK)}
                    getKeywordColor={getKeywordColor}
                    onEdit={handleEdit}
                    onDelete={(i) => handleDelete('doingKeywords', i)}
                />
                <KeywordList
                    title="Finished"
                    keywords={settings.doneKeywords}
                    onUpdate={(nw, oldK) => handleUpdate('doneKeywords', nw, oldK)}
                    getKeywordColor={getKeywordColor}
                    onEdit={handleEdit}
                    onDelete={(i) => handleDelete('doneKeywords', i)}
                />
            </div>
        </div>
    );
};
