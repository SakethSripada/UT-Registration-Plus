import type { CustomBlock } from '@shared/types/CustomBlock';
import { describe, expect, it } from 'vitest';
import { hasCustomBlockConflict } from './customBlocks';

const block: CustomBlock = {
    id: 'work',
    name: 'Work',
    days: ['Tuesday', 'Thursday'],
    startTime: 480,
    endTime: 780,
    allDay: false,
    scheduleId: null,
    conflictHighlight: true,
};
const meeting = { days: ['Tuesday'] as CustomBlock['days'], startTime: 600, endTime: 660 };

describe('custom block conflicts', () => {
    it('detects overlap, containment, and matching any meeting day', () => {
        expect(hasCustomBlockConflict([meeting], [block])).toBe(true);
        expect(hasCustomBlockConflict([meeting], [{ ...block, conflictHighlight: false }])).toBe(false);
        expect(hasCustomBlockConflict([{ ...meeting, startTime: 420, endTime: 840 }], [block])).toBe(true);
        expect(hasCustomBlockConflict([{ ...meeting, days: ['Monday', 'Thursday'] }], [block])).toBe(true);
    });
    it('allows adjacent times, other days, and asynchronous courses', () => {
        expect(hasCustomBlockConflict([{ ...meeting, startTime: 780, endTime: 840 }], [block])).toBe(false);
        expect(hasCustomBlockConflict([{ ...meeting, startTime: 420, endTime: 480 }], [block])).toBe(false);
        expect(hasCustomBlockConflict([{ ...meeting, days: ['Monday'] }], [block])).toBe(false);
        expect(hasCustomBlockConflict([], [block])).toBe(false);
    });
    it('checks every meeting, preserving minute precision', () => {
        expect(hasCustomBlockConflict([{ ...meeting, days: ['Friday'] }, meeting], [block])).toBe(true);
        expect(hasCustomBlockConflict([{ ...meeting, startTime: 779, endTime: 780 }], [block])).toBe(true);
    });
    it('treats all-day blocks as covering every time on their selected days', () => {
        const allDay = { ...block, allDay: true };
        expect(hasCustomBlockConflict([{ ...meeting, startTime: 0, endTime: 1 }], [allDay])).toBe(true);
        expect(hasCustomBlockConflict([{ ...meeting, startTime: 1439, endTime: 1440 }], [allDay])).toBe(true);
        expect(hasCustomBlockConflict([{ ...meeting, days: ['Friday'] }], [allDay])).toBe(false);
        expect(hasCustomBlockConflict([meeting], [{ ...allDay, conflictHighlight: false }])).toBe(false);
    });
});
