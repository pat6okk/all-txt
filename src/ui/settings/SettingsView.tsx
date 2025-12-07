import * as React from 'react';
import TodoTracker from '../../main';
import { VocabularySection } from './VocabularySection';

interface SettingsViewProps {
    plugin: TodoTracker;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ plugin }: SettingsViewProps) => {
    // Shared refresh trigger
    const [, setTick] = React.useState(0);
    const triggerRefresh = () => setTick(t => t + 1);

    return (
        <div className="todo-settings-view">
            <h1>TODO inline Settings (React Framework)</h1>
            <p>Refactored Settings View v0.2.0-alpha</p>

            <VocabularySection plugin={plugin} onSettingsChange={triggerRefresh} />

            <div className="todo-react-section">
                <h3>Workflows</h3>
                <div>Placeholder for Workflows Component</div>
            </div>

            <div className="todo-react-section">
                <h3>Metadata</h3>
                <div>Placeholder for Metadata Component</div>
            </div>
        </div>
    );
};
