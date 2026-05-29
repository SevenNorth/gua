import { CoinValue, GuaLines, YaoValue } from '../types';

const GUA_LINE_COUNT = 6;
const DEFAULT_COINS: CoinValue[] = [3, 3, 3];
const VALID_YAO_VALUES = new Set<number>([6, 7, 8, 9]);

/** 创建一个空卦，数组顺序对应页面展示顺序：上爻在前，初爻在后。 */
const createEmptyGua = (): GuaLines =>
    Array<YaoValue | undefined>(GUA_LINE_COUNT).fill(undefined);

/** 判断输入值是否为有效爻值。 */
const isValidYaoValue = (value: unknown): value is YaoValue => {
    return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        VALID_YAO_VALUES.has(value)
    );
};

/** 奇数爻为阳爻，偶数爻为阴爻。 */
const isYangYao = (yao: YaoValue) => yao % 2 === 1;

/** 判断六爻是否全部完成。 */
const isGuaComplete = (gua: GuaLines) => gua.every(isValidYaoValue);

/** 判断当前卦象中是否已有任意一爻。 */
const hasAnyYao = (gua: GuaLines) => gua.some((yao) => yao !== undefined);

/** 获取下一条待填写爻的展示位置，符合从下往上起卦的规则。 */
const getNextYaoIndexFromBottom = (gua: GuaLines): number | undefined => {
    for (let idx = gua.length - 1; idx >= 0; idx -= 1) {
        if (gua[idx] === undefined) {
            return idx;
        }
    }

    return undefined;
};

/** 将三枚硬币结果相加为一个爻值。 */
const sumCoins = (coins: CoinValue[]): YaoValue => {
    const total = coins.reduce<number>((sum, coin) => sum + coin, 0);

    if (!isValidYaoValue(total)) {
        throw new Error('Invalid coin result');
    }

    return total;
};

/** 将新爻填入当前卦象中最靠下的空位，符合从下往上起卦的规则。 */
const appendYaoFromBottom = (gua: GuaLines, yao: YaoValue): GuaLines => {
    const nextGua = [...gua];

    for (let idx = nextGua.length - 1; idx >= 0; idx -= 1) {
        if (nextGua[idx] === undefined) {
            nextGua[idx] = yao;
            break;
        }
    }

    return nextGua;
};

/** 更新指定显示位置的爻值，用于手动输入。 */
const updateYaoAtIndex = (
    gua: GuaLines,
    index: number,
    value: YaoValue,
): GuaLines => {
    const nextGua = [...gua];
    nextGua[index] = value;
    return nextGua;
};

/**
 * 将页面显示顺序的六爻转换为数据文件使用的卦码。
 * 页面数组是从上到下存放，卦码需要按从下到上拼接。
 */
const guaToCode = (gua: GuaLines): string | undefined => {
    if (!isGuaComplete(gua)) {
        return undefined;
    }

    return [...gua]
        .reverse()
        .map((yao) => (isYangYao(yao) ? '1' : '0'))
        .join('');
};

/** 将从下到上保存的卦码转换回页面从上到下展示的卦象。 */
const guaCodeToDisplayLines = (guaCode: string): GuaLines => {
    return guaCode
        .split('')
        .reverse()
        .map((line) => (line === '1' ? 7 : 8));
};

/** 将页面展示顺序的六爻转换为后端使用的从下到上顺序。 */
const guaToLinesFromBottom = (gua: GuaLines): YaoValue[] => {
    if (!isGuaComplete(gua)) {
        throw new Error('Invalid gua lines');
    }

    return [...gua].reverse() as YaoValue[];
};

/** 将后端从下到上保存的六爻转换为页面从上到下展示的顺序。 */
const linesFromBottomToDisplayLines = (lines: unknown): GuaLines | undefined => {
    if (!Array.isArray(lines) || lines.length !== GUA_LINE_COUNT) {
        return undefined;
    }

    const displayLines = [...lines].reverse();
    if (!displayLines.every(isValidYaoValue)) {
        return undefined;
    }

    return displayLines as GuaLines;
};

export {
    DEFAULT_COINS,
    appendYaoFromBottom,
    createEmptyGua,
    getNextYaoIndexFromBottom,
    guaCodeToDisplayLines,
    guaToCode,
    guaToLinesFromBottom,
    hasAnyYao,
    isGuaComplete,
    isValidYaoValue,
    isYangYao,
    linesFromBottomToDisplayLines,
    sumCoins,
    updateYaoAtIndex,
};
