import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { CoinValue, GuaLines, YaoValue } from '../types';
import { coinFlip } from '../utils';
import {
    DEFAULT_COINS,
    appendYaoFromBottom,
    createEmptyGua,
    guaToCode,
    hasAnyYao,
    isGuaComplete,
    isValidYaoValue,
    sumCoins,
    updateYaoAtIndex,
} from '../utils/gua';

const CASTING_DURATION = 2000;

/**
 * 管理一次起卦过程的状态。
 * 包含在线抛硬币、手动录入、重置、完成判断和卦码生成。
 */
const useGuaCasting = () => {
    const timerRef = useRef<number>();
    const [animating, setAnimating] = useState(false);
    const [coins, setCoins] = useState<CoinValue[]>(DEFAULT_COINS);
    const [gua, setGua] = useState<GuaLines>(createEmptyGua);

    const guaCode = useMemo(() => guaToCode(gua), [gua]);
    const isComplete = useMemo(() => isGuaComplete(gua), [gua]);
    const hasYao = useMemo(() => hasAnyYao(gua), [gua]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, []);

    const reset = useCallback(() => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
        }

        setAnimating(false);
        setCoins(DEFAULT_COINS);
        setGua(createEmptyGua());
    }, []);

    const setYaoAt = useCallback((index: number, value: number | null) => {
        if (!isValidYaoValue(value)) {
            return;
        }

        setGua((currentGua) => updateYaoAtIndex(currentGua, index, value));
    }, []);

    const castCoins = useCallback(() => {
        if (animating || isComplete) {
            return;
        }

        setAnimating(true);

        timerRef.current = window.setTimeout(() => {
            const nextCoins: CoinValue[] = [coinFlip(), coinFlip(), coinFlip()];
            const nextYao: YaoValue = sumCoins(nextCoins);

            setCoins(nextCoins);
            setGua((currentGua) => {
                if (isGuaComplete(currentGua)) {
                    return currentGua;
                }

                return appendYaoFromBottom(currentGua, nextYao);
            });
            setAnimating(false);
            timerRef.current = undefined;
        }, CASTING_DURATION);
    }, [animating, isComplete]);

    return {
        animating,
        castCoins,
        coins,
        gua,
        guaCode,
        hasYao,
        isComplete,
        reset,
        setYaoAt,
    };
};

export { useGuaCasting };
