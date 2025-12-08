import * as React from 'react';
import TodoTracker from '../../main';
import { applyCascadingLogic } from './workflow-utils';
import { setIcon } from 'obsidian';
import { SettingsService } from '../../services/settings-service';

interface WorkflowsSectionProps {
    plugin: TodoTracker;
    settingsService: SettingsService;
    onSettingsChange: () => void;
}

export const WorkflowsSection: React.FC<WorkflowsSectionProps> = ({ plugin, settingsService, onSettingsChange }) => {
    const [workflows, setWorkflows] = React.useState<string[][]>(plugin.settings.workflows);
    const [tick, setTick] = React.useState(0); // Force render for complex dependent states

    React.useEffect(() => {
        setWorkflows(plugin.settings.workflows);
    }, [plugin.settings.workflows]);

    const saveWorkflows = async (newFlows: string[][]) => {
        const cascaded = applyCascadingLogic(newFlows);
        await settingsService.updateWorkflows(cascaded);
        setWorkflows(cascaded); // Update local state
        setTick(t => t + 1);
        onSettingsChange();
    };

    const handleMoveFlow = (idx: number, direction: 'up' | 'down') => {
        if (direction === 'up' && idx > 0) {
            const newFlows = [...workflows];
            [newFlows[idx - 1], newFlows[idx]] = [newFlows[idx], newFlows[idx - 1]];
            saveWorkflows(newFlows);
        } else if (direction === 'down' && idx < workflows.length - 1) {
            const newFlows = [...workflows];
            [newFlows[idx + 1], newFlows[idx]] = [newFlows[idx], newFlows[idx + 1]];
            saveWorkflows(newFlows);
        }
    };

    // Helper to get allowed options for a select
    const getAvailableDoings = () => plugin.settings.doingKeywords || [];
    const getAvailableDones = () => plugin.settings.doneKeywords || [];

    const getKeywordColor = (k: string) => settingsService.getKeywordColor(k);

    /**
     * Determine if a step in a workflow is locked by a superior workflow
     */
    const isStepLocked = (flowIdx: number, stepIdx: number, stepValue: string): boolean => {
        const prevStep = workflows[flowIdx][stepIdx - 1];
        for (let i = 0; i < flowIdx; i++) {
            const master = workflows[i];
            const idxInMaster = master.indexOf(prevStep);
            if (idxInMaster !== -1 && idxInMaster < master.length - 1) {
                return true;
            }
        }
        return false;
    };

    const handleChangeStep = (flowIdx: number, stepIdx: number, newValue: string) => {
        const newFlows = [...workflows];
        newFlows[flowIdx] = [...newFlows[flowIdx]];
        newFlows[flowIdx][stepIdx] = newValue;
        saveWorkflows(newFlows);
    };

    const handleAddStep = (flowIdx: number, afterIdx: number) => {
        const newFlows = [...workflows];
        newFlows[flowIdx] = [...newFlows[flowIdx]];
        // Insert default doing
        const nextDoing = getAvailableDoings().find(d => !newFlows[flowIdx].includes(d)) || 'DOING';
        newFlows[flowIdx].splice(afterIdx + 1, 0, nextDoing);
        saveWorkflows(newFlows);
    };

    const handleRemoveStep = (flowIdx: number, atIdx: number) => {
        const newFlows = [...workflows];
        newFlows[flowIdx] = [...newFlows[flowIdx]];
        newFlows[flowIdx].splice(atIdx, 1);
        saveWorkflows(newFlows);
    };

    const handleReset = async () => {
        if (!confirm('Reset Workflows (Grammar) to defaults?')) return;

        await settingsService.resetWorkflows();
        setWorkflows(settingsService.settings.workflows);
        setTick(t => t + 1);
        onSettingsChange();
    };

    return (
        <div className="todo-flow-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>2. Workflows (Grammar)</h3>
                <button
                    onClick={handleReset}
                    style={{ fontSize: '0.8em', padding: '2px 8px', height: 'auto', opacity: 0.8 }}
                    title="Reset Workflows to Defaults"
                >
                    Reset Defaults
                </button>
            </div>
            <div style={{ display: 'flex', marginBottom: '10px', fontWeight: 'bold', color: 'var(--text-muted)' }}>
                <div style={{ width: '25%', textAlign: 'center' }}>Start</div>
                <div style={{ flex: 1, textAlign: 'center' }}>Actives</div>
                <div style={{ width: '25%', textAlign: 'center' }}>End</div>
            </div>

            <div className="todo-workflows-list">
                {workflows.map((flow, flowIdx) => {
                    const startState = flow[0];
                    const endState = flow[flow.length - 1];
                    const activeSteps = flow.slice(1, flow.length - 1); // Middle steps

                    return (
                        <div key={flowIdx} className="flow-card" style={{
                            backgroundColor: 'var(--background-secondary)',
                            borderRadius: '8px', padding: '15px', marginBottom: '15px',
                            border: '1px solid var(--background-modifier-border)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                {/* Start Column */}
                                <div style={{ width: '25%', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                                        <button className="clickable-icon" style={{ height: '12px', lineHeight: '10px', fontSize: '10px', padding: '0 4px', minWidth: '16px' }}
                                            disabled={flowIdx === 0} onClick={() => handleMoveFlow(flowIdx, 'up')}>▲</button>
                                        <button className="clickable-icon" style={{ height: '12px', lineHeight: '10px', fontSize: '10px', padding: '0 4px', minWidth: '16px' }}
                                            disabled={flowIdx === workflows.length - 1} onClick={() => handleMoveFlow(flowIdx, 'down')}>▼</button>
                                    </div>
                                    <div style={{
                                        fontWeight: 'bold', padding: '0 8px', borderLeft: `4px solid ${getKeywordColor(startState)}`,
                                        color: getKeywordColor(startState) === '#888888' ? 'var(--text-normal)' : getKeywordColor(startState)
                                    }}>
                                        {startState}
                                    </div>
                                </div>

                                {/* Active Steps Column */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {activeSteps.length === 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <button onClick={() => handleAddStep(flowIdx, 0)}>+ Add Step</button>
                                        </div>
                                    )}
                                    {activeSteps.map((step, idx) => {
                                        const realIdx = idx + 1;
                                        const locked = isStepLocked(flowIdx, realIdx, step);
                                        const color = getKeywordColor(step);

                                        return (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <select
                                                    value={step}
                                                    disabled={locked}
                                                    onChange={(e) => handleChangeStep(flowIdx, realIdx, e.target.value)}
                                                    style={{
                                                        borderLeft: `4px solid ${color}`, fontWeight: 'bold',
                                                        color: color === '#888888' ? 'var(--text-normal)' : color,
                                                        cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.6 : 1
                                                    }}
                                                >
                                                    {getAvailableDoings().map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                                {!locked && (
                                                    <>
                                                        <button style={{ fontSize: '10px', height: '24px' }} onClick={() => handleAddStep(flowIdx, realIdx)}>+ADD</button>
                                                        <button style={{ height: '24px', width: '24px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                            onClick={() => handleRemoveStep(flowIdx, realIdx)} title="Remove step">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* End Column */}
                                <div style={{ width: '25%', display: 'flex', justifyContent: 'center' }}>
                                    {(() => {
                                        const realIdx = flow.length - 1;
                                        const locked = isStepLocked(flowIdx, realIdx, endState);
                                        const color = getKeywordColor(endState);
                                        return (
                                            <select
                                                value={endState}
                                                disabled={locked}
                                                onChange={(e) => handleChangeStep(flowIdx, realIdx, e.target.value)}
                                                style={{
                                                    borderLeft: `4px solid ${color}`, fontWeight: 'bold',
                                                    color: color === '#888888' ? 'var(--text-normal)' : color,
                                                    cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.6 : 1
                                                }}
                                            >
                                                {getAvailableDones().map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Summary / Path */}
                            <div style={{
                                marginTop: '10px', borderTop: '1px dashed var(--background-modifier-border)', paddingTop: '5px',
                                fontSize: '0.85em', color: 'var(--text-muted)', textAlign: 'center'
                            }}>
                                flow: {flow.join(' -> ')} {'->'} {(workflows.find(f => f[f.length - 1] === endState)?.[0]) || flow[0]}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
