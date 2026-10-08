import { describe, expect, it } from 'vitest';
import { formatBlockTime, parseBlockTime } from './customBlockUtils';

describe('custom block times', () => {
    it('preserves every minute through the input conversion', () => {
        for (let minutes = 0; minutes < 1440; minutes++) {
            expect(parseBlockTime(formatBlockTime(minutes))).toBe(minutes);
        }
    });

    it.each(['', '24:00', '12:60', '08:03:30', '13:03pm', '00:03am', 'abc'])('rejects invalid input %j', value => {
        expect(parseBlockTime(value)).toBeNull();
    });

    it.each([
        ['8:03', 483],
        ['14:27', 867],
        [' 12:09 PM ', 729],
        ['12:00am', 0],
    ] as const)('accepts %s as %i minutes', (value, minutes) => expect(parseBlockTime(value)).toBe(minutes));

    it.each([
        [0, '12:00am'],
        [483, '8:03am'],
        [720, '12:00pm'],
        [729, '12:09pm'],
        [1439, '11:59pm'],
    ] as const)('formats %i minutes as %s', (minutes, formatted) => expect(formatBlockTime(minutes)).toBe(formatted));
});
