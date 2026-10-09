import { describe, expect, it } from 'vitest';
import { formatBlockTime, minuteAtPosition, parseBlockTime } from './customBlockUtils';

describe('custom block times', () => {
    it('maps drags to the nearest minute and clamps them to the visible day', () => {
        expect(minuteAtPosition(3, 780, 480, 1260)).toBe(483);
        expect(minuteAtPosition(-10, 780, 480, 1260)).toBe(480);
        expect(minuteAtPosition(900, 780, 480, 1260)).toBe(1259);
        expect(minuteAtPosition(800, 1440, 0, 1440)).toBe(800);
        expect(minuteAtPosition(1500, 1440, 0, 1440)).toBe(1439);
    });
    it('preserves every minute through the input conversion', () => {
        for (let minutes = 0; minutes < 1440; minutes++) {
            expect(parseBlockTime(formatBlockTime(minutes))).toBe(minutes);
        }
    });

    it('handles noon, midnight, arbitrary minutes, and invalid input', () => {
        expect(parseBlockTime('12:00am')).toBe(0);
        expect(parseBlockTime('12:09 PM')).toBe(729);
        expect(parseBlockTime('14:27')).toBe(867);
        expect(formatBlockTime(483)).toBe('8:03am');
        for (const value of ['', '24:00', '12:60', '13:03pm', '00:03am', 'abc']) {
            expect(parseBlockTime(value)).toBeNull();
        }
    });
});
