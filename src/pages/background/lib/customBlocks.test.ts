import type { CustomBlockDraft } from '@shared/types/CustomBlock';
import { customBlockToDraft, selectCustomBlocks } from '@shared/util/customBlocks';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const draft: CustomBlockDraft = {
    name: 'Work',
    days: ['Tuesday', 'Thursday'],
    startTime: 483,
    endTime: 789,
    allDay: false,
    syncAcrossAllSchedules: true,
    conflictHighlight: true,
};

async function setup(existingBlocks = true) {
    await import('../../../../.storybook/chrome-mock');
    await chrome.storage.local.set({
        schedules: ['one', 'two'].map(id => ({ id, name: id, courses: [], hours: 0, updatedAt: 0 })),
        activeIndex: 0,
        ...(existingBlocks ? { 'CustomBlockStore:blocks': [] } : {}),
    });
    const [{ UserScheduleStore }, { CustomBlockStore }, operations] = await Promise.all([
        import('@shared/storage/UserScheduleStore'),
        import('@shared/storage/CustomBlockStore'),
        import('./customBlocks'),
    ]);
    await UserScheduleStore.preload();
    if (existingBlocks) await CustomBlockStore.preload();
    return { ...operations, UserScheduleStore, CustomBlockStore };
}

beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
});

describe('custom block storage', () => {
    it('initializes storage on the first save', async () => {
        const { createCustomBlock, CustomBlockStore } = await setup(false);
        const block = await createCustomBlock(draft, 'one');
        expect(await CustomBlockStore.get('blocks')).toEqual([block]);
        expect(await chrome.storage.local.get('CustomBlockStore:blocks')).toEqual({
            'CustomBlockStore:blocks': [block],
        });
    });

    it('persists all metadata locally and leaves schedules and sync storage unchanged', async () => {
        const { createCustomBlock, UserScheduleStore, CustomBlockStore } = await setup();
        const schedules = await UserScheduleStore.get('schedules');
        const block = await createCustomBlock(draft, 'one');
        expect(block).toEqual({
            id: expect.any(String),
            name: 'Work',
            days: draft.days,
            startTime: 483,
            endTime: 789,
            allDay: false,
            scheduleId: null,
            conflictHighlight: true,
        });
        expect(await chrome.storage.local.get('CustomBlockStore:blocks')).toEqual({
            'CustomBlockStore:blocks': [block],
        });
        expect(await chrome.storage.sync.get(null)).toEqual({});
        expect(await UserScheduleStore.get('schedules')).toEqual(schedules);
        expect(await CustomBlockStore.get('blocks')).toEqual([block]);
        vi.resetModules();
        const { CustomBlockStore: reloaded } = await import('@shared/storage/CustomBlockStore');
        expect(await reloaded.get('blocks')).toEqual([block]);
    });

    it('applies global blocks to existing and newly created schedules and local blocks only to their schedule', async () => {
        const { createCustomBlock, CustomBlockStore } = await setup();
        const global = await createCustomBlock(draft, 'one');
        const local = await createCustomBlock({ ...draft, syncAcrossAllSchedules: false }, 'one');
        const { default: createSchedule } = await import('./createSchedule');
        const newId = await createSchedule('Future');
        const blocks = await CustomBlockStore.get('blocks');
        expect(selectCustomBlocks(blocks, 'one')).toEqual([global, local]);
        expect(selectCustomBlocks(blocks, 'two')).toEqual([global]);
        expect(selectCustomBlocks(blocks, newId)).toEqual([global]);
    });

    it('updates one shared block, preserves its ID, and changes scope in both directions', async () => {
        const { createCustomBlock, updateCustomBlock, CustomBlockStore } = await setup();
        const block = await createCustomBlock(draft, 'one');
        const local = await updateCustomBlock(
            block.id,
            {
                ...draft,
                name: ' Meeting ',
                allDay: true,
                conflictHighlight: false,
                syncAcrossAllSchedules: false,
            },
            'two'
        );
        expect(local).toMatchObject({
            id: block.id,
            name: 'Meeting',
            scheduleId: 'two',
            allDay: true,
            conflictHighlight: false,
        });
        expect(customBlockToDraft(local)).toMatchObject({
            syncAcrossAllSchedules: false,
            startTime: 483,
            endTime: 789,
        });
        expect(selectCustomBlocks(await CustomBlockStore.get('blocks'), 'one')).toEqual([]);
        const global = await updateCustomBlock(block.id, draft, 'two');
        expect(await CustomBlockStore.get('blocks')).toEqual([global]);
        expect(selectCustomBlocks([global], 'one')).toEqual([global]);
    });

    it('deletes a global block everywhere without deleting another block', async () => {
        const { createCustomBlock, deleteCustomBlock, CustomBlockStore } = await setup();
        const global = await createCustomBlock(draft, 'one');
        const local = await createCustomBlock({ ...draft, syncAcrossAllSchedules: false }, 'one');
        await deleteCustomBlock(global.id);
        const blocks = await CustomBlockStore.get('blocks');
        expect(selectCustomBlocks(blocks, 'one')).toEqual([local]);
        expect(selectCustomBlocks(blocks, 'two')).toEqual([]);
        await deleteCustomBlock(local.id);
        expect(await CustomBlockStore.get('blocks')).toEqual([]);
    });

    it('keeps every block when multiple calendar tabs create them concurrently', async () => {
        const { createCustomBlock, CustomBlockStore } = await setup();
        const blocks = await Promise.all(
            Array.from({ length: 10 }, (_, index) => createCustomBlock({ ...draft, name: `Block ${index}` }, 'one'))
        );
        expect(await CustomBlockStore.get('blocks')).toEqual(blocks);
        expect(new Set(blocks.map(block => block.id)).size).toBe(10);
    });

    it('rejects invalid operations without changing data or blocking later writes', async () => {
        const { createCustomBlock, updateCustomBlock, deleteCustomBlock, CustomBlockStore } = await setup();
        await expect(createCustomBlock(draft, 'missing')).rejects.toThrow('Schedule does not exist');
        await expect(createCustomBlock({ ...draft, startTime: 790 }, 'one')).rejects.toThrow('Invalid custom block');
        await expect(updateCustomBlock('missing', draft, 'one')).rejects.toThrow('Custom block does not exist');
        await expect(deleteCustomBlock('missing')).rejects.toThrow('Custom block does not exist');
        expect(await CustomBlockStore.get('blocks')).toEqual([]);
        const block = await createCustomBlock(draft, 'one');
        expect(await CustomBlockStore.get('blocks')).toEqual([block]);
    });

    it('responds to failed background messages so the dialog can show an error', async () => {
        await setup();
        const { default: handler } = await import('@pages/background/handler/customBlockHandler');
        const sendResponse = vi.fn();
        await handler.createCustomBlock({ data: { draft, scheduleId: 'missing' }, sender: {}, sendResponse });
        expect(sendResponse).toHaveBeenCalledWith({ error: 'Schedule does not exist' });
    });

    it('restores the previous state after a storage failure and allows retrying', async () => {
        const { createCustomBlock, updateCustomBlock, CustomBlockStore } = await setup();
        const block = await createCustomBlock(draft, 'one');
        vi.spyOn(chrome.storage.local, 'set').mockRejectedValueOnce(new Error('Storage unavailable'));
        await expect(updateCustomBlock(block.id, { ...draft, name: 'Changed' }, 'one')).rejects.toThrow(
            'Storage unavailable'
        );
        expect(await CustomBlockStore.get('blocks')).toEqual([block]);
        expect(await chrome.storage.local.get('CustomBlockStore:blocks')).toEqual({
            'CustomBlockStore:blocks': [block],
        });
        const updated = await updateCustomBlock(block.id, { ...draft, name: 'Changed' }, 'one');
        expect(await CustomBlockStore.get('blocks')).toEqual([updated]);
    });
});
