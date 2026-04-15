import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRates } from './fetchRates';

const mockFetch = (body: unknown, ok = true, status = 200) =>
    vi.stubGlobal(
        'fetch',
        vi.fn(() =>
            Promise.resolve({
                ok,
                status,
                json: () => Promise.resolve(body),
            } as Response),
        ),
    );

const obs = (d: string, v: string) => ({ d, FXUSDCAD: { v } });

describe('fetchRates', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('parses rates for requested dates', async () => {
        mockFetch({
            observations: [
                obs('2025-03-10', '1.3745'),
                obs('2025-03-11', '1.3750'),
            ],
        });

        const result = await fetchRates([new Date(2025, 2, 10), new Date(2025, 2, 11)]);

        expect(result).toEqual({
            '2025-03-10': 1_374_500n,
            '2025-03-11': 1_375_000n,
        });
    });

    it('looks back up to 2 days when observation is missing (weekend/holiday)', async () => {
        mockFetch({
            observations: [obs('2025-03-14', '1.4000')], // Friday
        });

        // Sunday — should fall back to Friday
        const result = await fetchRates([new Date(2025, 2, 16)]);

        expect(result).toEqual({ '2025-03-16': 1_400_000n });
    });

    it('returns ZERO when no observation is found even after lookback', async () => {
        mockFetch({ observations: [obs('2025-03-10', '1.3745')] });

        // date far from any observation
        const result = await fetchRates([new Date(2025, 5, 1)]);

        expect(result).toEqual({ '2025-06-01': 0n });
    });

    it('ignores observations without FXUSDCAD field', async () => {
        mockFetch({
            observations: [
                { d: '2025-03-10' }, // missing FXUSDCAD
                obs('2025-03-09', '1.3700'),
            ],
        });

        const result = await fetchRates([new Date(2025, 2, 10)]);

        expect(result).toEqual({ '2025-03-10': 1_370_000n });
    });

    it('throws on HTTP error', async () => {
        mockFetch({}, false, 503);

        await expect(fetchRates([new Date(2025, 2, 10)])).rejects.toThrow(
            /Failed to fetch exchange rates: HTTP error: 503/,
        );
    });

    it('wraps unknown fetch errors', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.reject(new Error('network down'))),
        );

        await expect(fetchRates([new Date(2025, 2, 10)])).rejects.toThrow(
            /Failed to fetch exchange rates: network down/,
        );
    });

    it('deduplicates repeated dates by keying on iso string', async () => {
        mockFetch({ observations: [obs('2025-03-10', '1.3745')] });

        const date = new Date(2025, 2, 10);
        const result = await fetchRates([date, date]);

        expect(Object.keys(result)).toEqual(['2025-03-10']);
        expect(result['2025-03-10']).toBe(1_374_500n);
    });
});
