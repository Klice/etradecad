export const MONEY_SCALE = 6n;
const UNIT = 10n ** MONEY_SCALE;
const HALF_UNIT = UNIT / 2n;

export type Money = bigint & { readonly __brand: 'Money' };

const brand = (b: bigint): Money => b as Money;

export const ZERO: Money = brand(0n);

const PARSE_RE = /^\s*(-?)(\d+)(?:\.(\d+))?\s*$/;

const abs = (b: bigint): bigint => (b < 0n ? -b : b);

export const moneyFromString = (raw: string | undefined): Money | null => {
    if (!raw) return null;
    let s = raw.trim();
    if (!s) return null;

    let negative = false;
    if (s.startsWith('(') && s.endsWith(')')) {
        negative = true;
        s = s.slice(1, -1);
    }
    s = s.replace(/[$,\s]/g, '');
    const match = PARSE_RE.exec(s);
    if (!match) return null;

    const [, sign, intPart, fracPartRaw = ''] = match;
    if (sign === '-') negative = !negative;

    let fracPart: string;
    if (fracPartRaw.length <= Number(MONEY_SCALE)) {
        fracPart = fracPartRaw.padEnd(Number(MONEY_SCALE), '0');
    } else {
        const keep = fracPartRaw.slice(0, Number(MONEY_SCALE));
        const roundDigit = fracPartRaw[Number(MONEY_SCALE)];
        fracPart = keep;
        if (roundDigit >= '5') {
            const bumped = (BigInt(fracPart) + 1n).toString().padStart(Number(MONEY_SCALE), '0');
            if (bumped.length > Number(MONEY_SCALE)) {
                // carry into integer part
                const intBumped = BigInt(intPart) + 1n;
                const value = intBumped * UNIT;
                return brand(negative ? -value : value);
            }
            fracPart = bumped;
        }
    }

    const value = BigInt(intPart) * UNIT + BigInt(fracPart);
    return brand(negative ? -value : value);
};

export const addMoney = (a: Money, b: Money): Money => brand(a + b);
export const subMoney = (a: Money, b: Money): Money => brand(a - b);

// Multiply two scale-6 values, result scale-6, half-away-from-zero rounding.
export const mulMoney = (a: Money, b: Money): Money => {
    const product = a * b;
    const negative = product < 0n;
    const rounded = (abs(product) + HALF_UNIT) / UNIT;
    return brand(negative ? -rounded : rounded);
};

export const sumMoney = (xs: Money[]): Money =>
    brand(xs.reduce<bigint>((acc, x) => acc + x, 0n));

const groupThousands = (intStr: string): string =>
    intStr.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export interface FormatMoneyOptions {
    decimals?: number;
    grouping?: boolean;
}

export const formatMoney = (m: Money, { decimals = 2, grouping = false }: FormatMoneyOptions = {}): string => {
    if (decimals < 0 || decimals > Number(MONEY_SCALE)) {
        throw new Error(`decimals must be between 0 and ${MONEY_SCALE}`);
    }
    const scale = 10n ** (MONEY_SCALE - BigInt(decimals));
    const halfScale = scale / 2n;
    const negative = m < 0n;
    const absValue = abs(m);
    const roundedUnits = (absValue + halfScale) / scale;
    const unit = 10n ** BigInt(decimals);
    const intPart = roundedUnits / unit;
    const fracPart = roundedUnits % unit;

    const intStr = grouping ? groupThousands(intPart.toString()) : intPart.toString();
    const fracStr = decimals > 0 ? `.${fracPart.toString().padStart(decimals, '0')}` : '';
    return `${negative ? '-' : ''}${intStr}${fracStr}`;
};
