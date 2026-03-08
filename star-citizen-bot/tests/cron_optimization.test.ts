import test from 'node:test';
import assert from 'node:assert';
import { setupCronJobs } from '../src/cron.ts';
import { Contract } from '../src/models/Contract.ts';
import cron from 'node-cron';

// Mock node-cron
const scheduledTasks: Record<string, () => Promise<void>> = {};
(cron.schedule as any) = (expression: string, task: () => Promise<void>) => {
    scheduledTasks[expression] = task;
};

// Mock Contract
let updateCount = 0;
let bulkUpdateCount = 0;

(Contract.findAll as any) = async (options: any) => {
    if (options.where.status === 'OPEN') {
        return [
            { id: 1, messageId: 'm1', update: async () => { updateCount++; } },
            { id: 2, messageId: 'm2', update: async () => { updateCount++; } },
        ];
    } else if (options.where.status === 'COMPLETED') {
        return [
            { id: 3, channelId: 'c1', update: async () => { updateCount++; } },
            { id: 4, channelId: 'c2', update: async () => { updateCount++; } },
        ];
    }
    return [];
};

(Contract.update as any) = async () => {
    bulkUpdateCount++;
};

// Mock Discord Client
const mockClient = {
    channels: {
        cache: {
            get: () => ({
                messages: {
                    fetch: async () => ({
                        embeds: [{}],
                        edit: async () => {}
                    })
                }
            })
        }
    },
    guilds: {
        cache: {
            get: () => ({
                channels: {
                    cache: {
                        get: () => ({
                            delete: async () => {}
                        })
                    }
                }
            })
        }
    }
} as any;

test('Cron jobs Optimization Check (Imported)', async (t) => {
    setupCronJobs(mockClient);

    // 1. Relist Expired Contracts
    updateCount = 0;
    bulkUpdateCount = 0;
    const relistTask = scheduledTasks['*/5 * * * *'];
    assert.ok(relistTask, 'Relist task should be scheduled');
    await relistTask();
    console.log(`Relist Task - update calls: ${updateCount}, bulk update calls: ${bulkUpdateCount}`);
    assert.strictEqual(updateCount, 0, 'Should have 0 individual update calls');
    assert.strictEqual(bulkUpdateCount, 1, 'Should have 1 bulk update call');

    // 2. Cleanup Archived Channels
    updateCount = 0;
    bulkUpdateCount = 0;
    const cleanupTask = scheduledTasks['0 0 1 * *'];
    assert.ok(cleanupTask, 'Cleanup task should be scheduled');
    await cleanupTask();
    console.log(`Cleanup Task - update calls: ${updateCount}, bulk update calls: ${bulkUpdateCount}`);
    assert.strictEqual(updateCount, 0, 'Should have 0 individual update calls');
    assert.strictEqual(bulkUpdateCount, 1, 'Should have 1 bulk update call');
});
