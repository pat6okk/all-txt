
/**
 * Enforces consistency across workflows.
 * Since getNextState() uses the first matching workflow, any subsequent workflow
 * that shares a state MUST follow the same path from that state onwards.
 * Otherwise, the UI would show a path that isn't actually executing.
 */
export function applyCascadingLogic(workflows: string[][]): string[][] {
    // Deep copy to avoid mutating logic issues during iteration, although we mutate in place for the result
    // But here we're operating on the array passed in (or we can return a new one).
    // Let's modify in place to match previous behavior pattern or return new.
    // React prefers new objects.
    const newWorkflows = workflows.map(flow => [...flow]);

    for (let i = 0; i < newWorkflows.length; i++) {
        const master = newWorkflows[i];

        for (let j = i + 1; j < newWorkflows.length; j++) {
            const slave = newWorkflows[j];

            // Find first shared state (excluding the End state mostly? No, any state).
            // Actually, we iterate through the slave's active steps (middle ones) to find if they exist in master.
            // But really, if ANY state matches, the rest of the chain should match.
            // The original logic seemed to focus on "actives".

            // Iterate through slave steps
            for (let k = 0; k < slave.length - 1; k++) { // excluding the very last item? 
                const slaveStep = slave[k];

                // Does this step exist in master?
                const idxInMaster = master.indexOf(slaveStep);

                // If it exists and is not the very last step of master (which is an end state usually)
                if (idxInMaster !== -1 && idxInMaster < master.length - 1) {

                    // We found a synchronization point.
                    // Slave MUST follow Master from this point.

                    // Master tail: everything after idxInMaster
                    const masterTail = master.slice(idxInMaster + 1);

                    // Slave prefix: everything up to and including occurance k
                    const slavePrefix = slave.slice(0, k + 1);

                    // Combine
                    const newSlave = [...slavePrefix, ...masterTail];

                    // Replace the slave workflow
                    newWorkflows[j] = newSlave;

                    // Break inner loop, as the rest of the slave is now determined by master
                    break;
                }
            }
        }
    }

    return newWorkflows;
}
