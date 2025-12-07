import * as React from 'react';
import TodoTracker from '../../main';
import { KeywordList } from './KeywordList';
import { KeywordEditModal } from '../../settings/keyword-modal';

interface VocabularySectionProps {
    plugin: TodoTracker;
    // We might want to trigger a refresh on parent when settings change
    onSettingsChange: () => void;
}

export const VocabularySection: React.FC<VocabularySectionProps> = ({ plugin, onSettingsChange }) => {
    const [settings, setSettings] = React.useState(plugin.settings);

    // Sync state if plugin settings change externally (unlikely active sync, but good practice)
    React.useEffect(() => {
        setSettings(plugin.settings);
    }, [plugin.settings]);

    const handleUpdate = async (key: 'todoKeywords' | 'doingKeywords' | 'doneKeywords', newKeywords: string[]) => {
        plugin.settings[key] = newKeywords;

        // Special logic for Start Keywords (Cascading workflow update)
        if (key === 'todoKeywords') {
            const currentWorkflows = plugin.settings.workflows;
            const newWorkflows: string[][] = [];
            const defaultDone = plugin.settings.doneKeywords[0] || 'DONE';

            plugin.settings.todoKeywords.forEach(k => {
                const existing = currentWorkflows.find(w => w[0] === k);
                if (existing) newWorkflows.push([...existing]);
                else newWorkflows.push([k, defaultDone]);
            });
            plugin.settings.workflows = newWorkflows;
        }

        await plugin.saveSettings();
        plugin.recreateParser();
        plugin.taskStore.scanVault(); // Trigger Reactive Update
        setSettings({ ...plugin.settings }); // Force re-render
        onSettingsChange();
    };

    const getKeywordColor = (k: string) => {
        return plugin.settings.keywordColors[k] || '#888888';
    };

    const handleEdit = (k: string) => {
        new KeywordEditModal(plugin.app, k, getKeywordColor(k), plugin.settings.keywordDescriptions[k] || '', async (res) => {
            plugin.settings.keywordColors[k] = res.color;
            plugin.settings.keywordDescriptions[k] = res.description;
            await plugin.saveSettings();
            setSettings({ ...plugin.settings });
            onSettingsChange();
        }).open();
    };

    const handleDelete = (key: 'todoKeywords' | 'doingKeywords' | 'doneKeywords', idx: number) => {
        const k = plugin.settings[key][idx];
        if (confirm(`Delete '${k}'?`)) {
            const newKw = [...plugin.settings[key]];
            newKw.splice(idx, 1);
            handleUpdate(key, newKw);
        }
    };

    return (
        <div className="todo-vocab-section">
            <h3>1. Keywords (Vocabulary)</h3>
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto' }}>
                <KeywordList
                    title="Start States"
                    keywords={settings.todoKeywords}
                    onUpdate={(nw) => handleUpdate('todoKeywords', nw)}
                    getKeywordColor={getKeywordColor}
                    onEdit={handleEdit}
                    onDelete={(i) => handleDelete('todoKeywords', i)}
                />
                <KeywordList
                    title="In-Progress"
                    keywords={settings.doingKeywords}
                    onUpdate={(nw) => handleUpdate('doingKeywords', nw)}
                    getKeywordColor={getKeywordColor}
                    onEdit={handleEdit}
                    onDelete={(i) => handleDelete('doingKeywords', i)}
                />
                <KeywordList
                    title="Finished"
                    keywords={settings.doneKeywords}
                    onUpdate={(nw) => handleUpdate('doneKeywords', nw)}
                    getKeywordColor={getKeywordColor}
                    onEdit={handleEdit}
                    onDelete={(i) => handleDelete('doneKeywords', i)}
                />
            </div>
        </div>
    );
};
