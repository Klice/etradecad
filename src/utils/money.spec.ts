import { describe, expect, it } from 'vitest';
import {
    addMoney,
    formatMoney,
    moneyFromString,
    mulMoney,
    MONEY_SCALE,
    subMoney,
    sumMoney,
    ZERO,
    type Money,
} from './money';

const money = (b: bigint): Money => b as Money;

describe('MONEY_SCALE', () => {
    it('is 6', () => {
        expect(MONEY_SCALE).toBe(6n);
    });
});

describe('ZERO', () => {
    it('is 0n', () => {
        expect(ZERO).toBe(0n);
    });
});

describe('moneyFromString', () => {
    describe('valid inputs', () => {
        it.each([
            ['0', 0n],
            ['1', 1_000_000n],
            ['1.5', 1_500_000n],
            ['1234.56', 1_234_560_000n],
            ['1.3745', 1_374_500n],
            ['0.000001', 1n],
            ['-1.5', -1_500_000n],
            ['-0', 0n],
        ])('parses "%s" as %s', (input, expected) => {
            expect(moneyFromString(input)).toBe(expected);
        });

        it('strips $ sign', () => {
            expect(moneyFromString('$1234.56')).toBe(1_234_560_000n);
        });

        it('strips thousand separators', () => {
            expect(moneyFromString('1,234,567.89')).toBe(1_234_567_890_000n);
        });

        it('strips surrounding whitespace', () => {
            expect(moneyFromString('  42.00  ')).toBe(42_000_000n);
        });

        it('treats parentheses as negative (accounting notation)', () => {
            expect(moneyFromString('(1234.56)')).toBe(-1_234_560_000n);
        });

        it('double-negates parens + minus', () => {
            expect(moneyFromString('(-1.5)')).toBe(1_500_000n);
        });

        it('handles mixed $ and commas and parens', () => {
            expect(moneyFromString('($1,234.56)')).toBe(-1_234_560_000n);
        });

        it('pads fractional part shorter than scale', () => {
            expect(moneyFromString('1.2')).toBe(1_200_000n);
        });
    });

    describe('rounding of over-precise input', () => {
        it('rounds half-up when 7th decimal is >= 5', () => {
            expect(moneyFromString('1.2345675')).toBe(1_234_568n);
        });

        it('truncates when 7th decimal < 5', () => {
            expect(moneyFromString('1.2345674')).toBe(1_234_567n);
        });

        it('propagates carry through all nines', () => {
            expect(moneyFromString('1.9999995')).toBe(2_000_000n);
        });

        it('carries into integer part', () => {
            expect(moneyFromString('0.9999999')).toBe(1_000_000n);
        });
    });

    describe('invalid inputs', () => {
        it.each([
            [undefined],
            [''],
            ['   '],
            ['abc'],
            ['1.2.3'],
            ['1,2.3.4'],
            ['$$'],
        ])('returns null for %s', (input) => {
            expect(moneyFromString(input)).toBeNull();
        });
    });
});

describe('addMoney', () => {
    it('adds positive amounts', () => {
        expect(addMoney(money(1_000_000n), money(2_500_000n))).toBe(3_500_000n);
    });

    it('handles negatives', () => {
        expect(addMoney(money(1_000_000n), money(-500_000n))).toBe(500_000n);
    });

    it('is commutative', () => {
        const a = money(123_456_789n);
        const b = money(987_654_321n);
        expect(addMoney(a, b)).toBe(addMoney(b, a));
    });
});

describe('subMoney', () => {
    it('subtracts amounts', () => {
        expect(subMoney(money(3_000_000n), money(1_000_000n))).toBe(2_000_000n);
    });

    it('yields negative result when b > a', () => {
        expect(subMoney(money(1_000_000n), money(3_000_000n))).toBe(-2_000_000n);
    });
});

describe('mulMoney', () => {
    it('multiplies simple whole numbers', () => {
        // 2.0 * 3.0 = 6.0
        expect(mulMoney(money(2_000_000n), money(3_000_000n))).toBe(6_000_000n);
    });

    it('multiplies identity (× 1.0)', () => {
        expect(mulMoney(money(1_234_560_000n), money(1_000_000n))).toBe(1_234_560_000n);
    });

    it('multiplies zero', () => {
        expect(mulMoney(money(1_234_560_000n), ZERO)).toBe(0n);
    });

    it('computes USD * FX rate (realistic case)', () => {
        // $1234.56 * 1.3745 = $1696.90272
        const usd = money(1_234_560_000n);
        const rate = money(1_374_500n);
        expect(mulMoney(usd, rate)).toBe(1_696_902_720n);
    });

    it('rounds .5 up to the next scale-6 unit', () => {
        // produce product at scale-12 where fractional part in scale-6 equals exactly 0.5 unit
        // a = 3n (= 3e-6), b = 500_000n (= 0.5) → product = 1_500_000 (scale-12) = 0.0000015 → half-up → 2e-6
        expect(mulMoney(money(3n), money(500_000n))).toBe(2n);
    });

    it('rounds half-away-from-zero for negatives', () => {
        // -0.0000015 → -2e-6 (same magnitude rounding)
        expect(mulMoney(money(-3n), money(500_000n))).toBe(-2n);
    });

    it('truncates when below half', () => {
        // 1 * 499_999 = 499_999 (scale-12) / 1e6 with half-up < 500_000 → 0
        expect(mulMoney(money(1n), money(499_999n))).toBe(0n);
    });

    it('handles large values without overflow (BigInt is arbitrary precision)', () => {
        const bigUsd = money(1_000_000_000_000n); // $1,000,000
        const rate = money(1_374_500n); // 1.3745
        expect(mulMoney(bigUsd, rate)).toBe(1_374_500_000_000n); // $1,374,500.00
    });
});

describe('sumMoney', () => {
    it('sums an array', () => {
        expect(sumMoney([money(1_000_000n), money(2_000_000n), money(3_000_000n)])).toBe(6_000_000n);
    });

    it('returns ZERO for empty array', () => {
        expect(sumMoney([])).toBe(0n);
    });

    it('handles mixed signs', () => {
        expect(sumMoney([money(5_000_000n), money(-2_000_000n), money(-1_000_000n)])).toBe(2_000_000n);
    });

    it('does not lose precision over many small additions', () => {
        // 10 million adds of 1 micro-unit each
        const ones = Array<Money>(10_000_000).fill(money(1n));
        expect(sumMoney(ones)).toBe(10_000_000n);
    });
});

describe('formatMoney', () => {
    describe('default (2 decimals, no grouping)', () => {
        it.each([
            [0n, '0.00'],
            [1_000_000n, '1.00'],
            [1_234_560_000n, '1234.56'],
            [-1_500_000n, '-1.50'],
            [500_000n, '0.50'],
        ])('formats %s as "%s"', (input, expected) => {
            expect(formatMoney(money(input))).toBe(expected);
        });
    });

    describe('rounding at display level', () => {
        it('rounds up at .005', () => {
            // 1.235000 → "1.24" with decimals=2? 0.235 → 0.24 (half-up on last shown digit)
            expect(formatMoney(money(1_235_000n))).toBe('1.24');
        });

        it('rounds down below .005', () => {
            expect(formatMoney(money(1_234_999n))).toBe('1.23');
        });

        it('rounds up exactly half of last shown digit', () => {
            // 0.125 with decimals=2 → "0.13"
            expect(formatMoney(money(125_000n), { decimals: 2 })).toBe('0.13');
        });

        it('rounds negative values symmetrically (away from zero)', () => {
            expect(formatMoney(money(-1_235_000n))).toBe('-1.24');
        });
    });

    describe('custom decimals', () => {
        it('formats with 4 decimals (FX rate)', () => {
            expect(formatMoney(money(1_374_500n), { decimals: 4 })).toBe('1.3745');
        });

        it('formats with 0 decimals', () => {
            expect(formatMoney(money(1_500_000n), { decimals: 0 })).toBe('2');
        });

        it('formats with 6 decimals (full scale)', () => {
            expect(formatMoney(money(1_234_567n), { decimals: 6 })).toBe('1.234567');
        });

        it('throws on decimals < 0', () => {
            expect(() => formatMoney(money(0n), { decimals: -1 })).toThrow();
        });

        it('throws on decimals > MONEY_SCALE', () => {
            expect(() => formatMoney(money(0n), { decimals: 7 })).toThrow();
        });
    });

    describe('grouping (thousand separators)', () => {
        it('groups integer part', () => {
            expect(formatMoney(money(1_234_567_890_000n), { grouping: true })).toBe('1,234,567.89');
        });

        it('does not group short integer', () => {
            expect(formatMoney(money(123_000_000n), { grouping: true })).toBe('123.00');
        });

        it('groups negative values', () => {
            expect(formatMoney(money(-1_234_567_890_000n), { grouping: true })).toBe('-1,234,567.89');
        });

        it('off by default', () => {
            expect(formatMoney(money(1_000_000_000_000n))).toBe('1000000.00');
        });
    });
});

describe('round-trip: moneyFromString → formatMoney', () => {
    it.each([
        ['0.00', '0.00'],
        ['1.00', '1.00'],
        ['1234.56', '1234.56'],
        ['-42.50', '-42.50'],
        ['0.01', '0.01'],
    ])('"%s" round-trips to "%s"', (input, expected) => {
        const parsed = moneyFromString(input);
        expect(parsed).not.toBeNull();
        expect(formatMoney(parsed!)).toBe(expected);
    });
});
