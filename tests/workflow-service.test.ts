import { WorkflowService } from '../src/services/workflow-service';
import { TodoTrackerSettings } from '../src/settings/settings';

describe('WorkflowService', () => {
    let service: WorkflowService;
    let mockSettings: TodoTrackerSettings;

    beforeEach(() => {
        mockSettings = {
            todoKeywords: ["TODO", "LATER"],
            doingKeywords: ["DOING"],
            doneKeywords: ["DONE"],
            keywordColors: {},
            includeCodeBlocks: false,
            includeCalloutBlocks: true,
            languageCommentSupport: { enabled: false },
            taskViewMode: 'default',
            sortMethod: 'default',
            collapsedPaths: [],
            // Default workflows
            workflows: [['TODO', 'DOING', 'DONE']]
        };
        service = new WorkflowService(mockSettings);
    });

    test('should cycle through default workflow', () => {
        expect(service.getNextState('TODO')).toBe('DOING');
        expect(service.getNextState('DOING')).toBe('DONE');
        expect(service.getNextState('DONE')).toBe('TODO'); // Loop check
    });

    test('should handle custom workflows', () => {
        mockSettings.workflows = [
            ['A', 'B', 'C'],
            ['X', 'Y']
        ];
        service.updateSettings(mockSettings);

        // Flow 1
        expect(service.getNextState('A')).toBe('B');
        expect(service.getNextState('B')).toBe('C');
        expect(service.getNextState('C')).toBe('A');

        // Flow 2
        expect(service.getNextState('X')).toBe('Y');
        expect(service.getNextState('Y')).toBe('X');
    });

    test('should prioritize first matching workflow', () => {
        // 'SHARED' exists in both, but flow1 matches first
        mockSettings.workflows = [
            ['START', 'SHARED', 'END1'],
            ['OTHER', 'SHARED', 'END2']
        ];
        service.updateSettings(mockSettings);

        expect(service.getNextState('SHARED')).toBe('END1');
    });

    test('should fallback to linear cycle for orphan states', () => {
        // configure workflows that DONT include LATER
        mockSettings.workflows = [['TODO', 'DONE']];
        service.updateSettings(mockSettings);

        // LATER is in todoKeywords but not in workflows.
        // It should fallback to getAllKeywords() order: TODO, LATER, DOING, DONE

        // Let's see where LATER is in the flat list
        // default: TODO, LATER, DOING, DONE

        expect(service.getNextState('LATER')).toBe('DOING');
    });

    test('should handle unknown states conservatively', () => {
        // UNKNOWN state -> First available state (TODO)
        expect(service.getNextState('UNKNOWN_STATE')).toBe('TODO');
    });
});
