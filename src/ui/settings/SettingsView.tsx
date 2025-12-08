import * as React from 'react';
import TodoTracker from '../../main';
import { VocabularySection } from './VocabularySection';
import { WorkflowsSection } from './WorkflowsSection';

import { MetadataSection } from './MetadataSection';
import { DEFAULT_SETTINGS } from '../../settings/defaults';

import { SettingsService } from '../../services/settings-service';

interface SettingsViewProps {
    plugin: TodoTracker;
    settingsService: SettingsService;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ plugin, settingsService }: SettingsViewProps) => {
    // Shared refresh trigger
    const [, setTick] = React.useState(0);
    const triggerRefresh = () => setTick(t => t + 1);

    return (
        <div className="todo-settings-view">
            <h1>TODO inline Settings (React Framework)</h1>
            <p>Refactored Settings View v0.2.0-alpha</p>

            <VocabularySection plugin={plugin} settingsService={settingsService} onSettingsChange={triggerRefresh} />
            <WorkflowsSection plugin={plugin} settingsService={settingsService} onSettingsChange={triggerRefresh} />
            <MetadataSection plugin={plugin} settingsService={settingsService} onSettingsChange={triggerRefresh} />
        </div>
    );
};
