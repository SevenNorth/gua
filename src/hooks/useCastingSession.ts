import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    CastingMode,
    CastingSnapshot,
    CastingStep,
    CoinValue,
    GuaHistoryRecord,
    GuaLines,
    IGua,
    YaoValue,
} from '../types';
import { coinFlip } from '../utils';
import {
    DEFAULT_COINS,
    appendYaoFromBottom,
    createEmptyGua,
    getNextYaoIndexFromBottom,
    guaToCode,
    hasAnyYao,
    isGuaComplete,
    isValidYaoValue,
    sumCoins,
    updateYaoAtIndex,
} from '../utils/gua';
import {
    clearCurrentCastingSnapshot,
    clearHistoryRecords,
    loadCurrentCastingSnapshot,
    loadHistoryRecords,
    saveCurrentCastingSnapshot,
    upsertHistoryRecord,
} from '../utils/storage';

const CASTING_DURATION = 2000;

const createHistoryId = (createdAt: string, guaCode: string) =>
    `${createdAt}-${guaCode}`;

const createSnapshot = (params: {
    question: string;
    createdAt: string;
    step: CastingStep;
    mode?: CastingMode;
    gua: GuaLines;
    guaCode?: string;
    baseReadingCompleted: boolean;
}): CastingSnapshot => ({
    version: 1,
    ...params,
});

const useCastingSession = () => {
    const timerRef = useRef<number>();
    const [initialSnapshot] = useState(() => loadCurrentCastingSnapshot());

    const [animating, setAnimating] = useState(false);
    const [coins, setCoins] = useState<CoinValue[]>(DEFAULT_COINS);
    const [question, setQuestionState] = useState(
        () => initialSnapshot?.question ?? '',
    );
    const [createdAt, setCreatedAt] = useState(
        () => initialSnapshot?.createdAt ?? '',
    );
    const [step, setStep] = useState<CastingStep>(
        () => initialSnapshot?.step ?? 'init',
    );
    const [mode, setMode] = useState<CastingMode | undefined>(
        () => initialSnapshot?.mode,
    );
    const [gua, setGua] = useState<GuaLines>(
        () => initialSnapshot?.gua ?? createEmptyGua(),
    );
    const [baseReadingCompleted, setBaseReadingCompleted] = useState(
        () => initialSnapshot?.baseReadingCompleted ?? false,
    );
    const [historyRecords, setHistoryRecords] = useState<GuaHistoryRecord[]>(
        () => loadHistoryRecords(),
    );

    const guaCode = useMemo(() => guaToCode(gua), [gua]);
    const isComplete = useMemo(() => isGuaComplete(gua), [gua]);
    const hasYao = useMemo(() => hasAnyYao(gua), [gua]);
    const nextYaoIndex = useMemo(() => getNextYaoIndexFromBottom(gua), [gua]);
    const isQuestionLocked = step !== 'init';

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (guaCode && step === 'input') {
            setStep('result');
        }
    }, [guaCode, step]);

    useEffect(() => {
        if (step === 'init' && !createdAt && !hasYao) {
            clearCurrentCastingSnapshot();
            return;
        }

        saveCurrentCastingSnapshot(
            createSnapshot({
                question,
                createdAt,
                step,
                mode,
                gua,
                guaCode,
                baseReadingCompleted,
            }),
        );
    }, [
        baseReadingCompleted,
        createdAt,
        gua,
        guaCode,
        hasYao,
        mode,
        question,
        step,
    ]);

    const ensureStarted = useCallback(
        (nextMode: CastingMode) => {
            if (step === 'result') {
                return false;
            }

            if (step === 'init') {
                setCreatedAt(new Date().toISOString());
                setStep('input');
            }

            setMode((currentMode) => currentMode ?? nextMode);
            setBaseReadingCompleted(false);
            return true;
        },
        [step],
    );

    const setQuestion = useCallback(
        (value: string) => {
            if (isQuestionLocked) {
                return;
            }

            setQuestionState(value);
        },
        [isQuestionLocked],
    );

    const startCasting = useCallback(
        (nextMode: CastingMode) => {
            ensureStarted(nextMode);
        },
        [ensureStarted],
    );

    const setYaoAt = useCallback(
        (index: number, value: number | null) => {
            if (!isValidYaoValue(value) || isComplete) {
                return;
            }

            if (!ensureStarted('manual')) {
                return;
            }

            setGua((currentGua) => updateYaoAtIndex(currentGua, index, value));
        },
        [ensureStarted, isComplete],
    );

    const castCoins = useCallback(() => {
        if (animating || isComplete) {
            return;
        }

        if (!ensureStarted('online')) {
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
    }, [animating, ensureStarted, isComplete]);

    const restart = useCallback(() => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = undefined;
        }

        setAnimating(false);
        setCoins(DEFAULT_COINS);
        setQuestionState('');
        setCreatedAt('');
        setStep('init');
        setMode(undefined);
        setGua(createEmptyGua());
        setBaseReadingCompleted(false);
        clearCurrentCastingSnapshot();
    }, []);

    const markBaseReadingCompleted = useCallback(
        (guaResult: IGua) => {
            if (!createdAt || !guaCode || !isComplete) {
                return;
            }

            setBaseReadingCompleted(true);

            const record: GuaHistoryRecord = {
                id: createHistoryId(createdAt, guaCode),
                question,
                createdAt,
                lines: gua,
                guaCode,
                guaName: guaResult.name,
            };

            setHistoryRecords(upsertHistoryRecord(record));
        },
        [createdAt, gua, guaCode, isComplete, question],
    );

    const openHistoryRecord = useCallback((record: GuaHistoryRecord) => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = undefined;
        }

        setAnimating(false);
        setCoins(DEFAULT_COINS);
        setQuestionState(record.question);
        setCreatedAt(record.createdAt);
        setStep('result');
        setMode(undefined);
        setGua(record.lines);
        setBaseReadingCompleted(true);
    }, []);

    const clearHistory = useCallback(() => {
        clearHistoryRecords();
        setHistoryRecords([]);
    }, []);

    return {
        animating,
        baseReadingCompleted,
        castCoins,
        clearHistory,
        coins,
        createdAt,
        gua,
        guaCode,
        hasYao,
        historyRecords,
        isComplete,
        isQuestionLocked,
        markBaseReadingCompleted,
        mode,
        nextYaoIndex,
        openHistoryRecord,
        question,
        restart,
        setQuestion,
        setYaoAt,
        startCasting,
        step,
    };
};

export { useCastingSession };
