import { describe, expect, it } from 'vitest';
import { type CalendarLayoutCell, calculateCourseCellColumns, calendarCellPosition } from './calendarLayout';

function cell(startIndex: number, endIndex: number): CalendarLayoutCell {
    return { async: false, calendarGridPoint: { dayIndex: 0, startIndex, endIndex } };
}

describe('calendar layout', () => {
    it('keeps overlapping courses and blocks in separate columns', () => {
        const cells = [cell(3, 5), cell(4, 6), cell(6, 7)];
        calculateCourseCellColumns(cells);
        expect(cells.map(value => [value.gridColumnStart, value.totalColumns])).toEqual([
            [1, 2],
            [2, 2],
            [1, 1],
        ]);
    });
    it('handles chained overlaps and unsorted inputs', () => {
        const cells = [cell(5, 7), cell(3, 5), cell(4, 6)];
        calculateCourseCellColumns(cells);
        expect(cells.every(value => value.totalColumns === 2)).toBe(true);
        expect(cells.map(value => value.gridColumnStart)).toEqual([1, 1, 2]);
    });
    it('places arbitrary minutes without rounding to a half hour', () => {
        const position = calendarCellPosition(cell(3 + 3 / 30, 3 + 69 / 30), 26);
        expect(Number.parseFloat(position.top)).toBeCloseTo((3 / 780) * 100);
        expect(Number.parseFloat(position.height)).toBeCloseTo((66 / 780) * 100);
    });
    it('fills the visible day for all-day blocks', () => {
        expect(calendarCellPosition(cell(3, 29), 26)).toEqual({ top: '0%', height: '100%', left: '0%', width: '100%' });
    });
    it('separates even one-minute overlaps', () => {
        const cells = [cell(3, 3 + 1 / 30), cell(3, 4)];
        calculateCourseCellColumns(cells);
        expect(cells.map(value => value.gridColumnStart)).toEqual([1, 2]);
    });
});
