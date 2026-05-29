import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    CastingMode,
    CastingSnapshot,
    CastingStep,
    CoinValue,
    GuaHistoryRecord,
    GuaLines,
    IGua,
    UsageState,
    YaoValue,
} from '../types';
import { coinFlip } from '../utils';
import {
    DEFAULT_COINS,
    appendYaoFromBottom,
    createEmptyGua,
    getNextYaoIndexFromBottom,
    guaToCode,
    guaToLinesFromBottom,
    hasAnyYao,
    isGuaComplete,
    isValidYaoValue,
    linesFromBottomToDisplayLines,
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
import {
    BackendCasting,
    createCasting,
    getVisitorSession,
    restartCasting,
    updateCastingLines,
} from '../services/casting';

const CASTING_DURATION = 2000;

const createHistoryId = (createdAt: string, guaCode: string) =>
    `${createdAt}-${guaCode}`;

const createSnapshot = (params: {
    castingId?: string;
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

const isBackendCastingOpen = (
    casting: BackendCasting | null,
): casting is BackendCasting =>
    !!casting &&
    ['casting', 'base_reading_loading', 'base_reading_completed'].includes(
        casting.status,
    );

const getStepFromBackendCasting = (casting: BackendCasting): CastingStep => {
    if (casting.status === 'base_reading_completed') {
        return 'result';
    }

    return 'input';
};

const getLinesFromBackendCasting = (casting: BackendCasting): GuaLines => {
    if (casting.lines) {
        return linesFromBottomToDisplayLines(casting.lines) ?? createEmptyGua();
    }

    if (casting.guaCode) {
        return linesFromBottomToDisplayLines(
            casting.guaCode.split('').map((line) => (line === '1' ? 7 : 8)),
        ) ?? createEmptyGua();
    }

    return createEmptyGua();
};

const createHistoryRecord = (params: {
    createdAt: string;
    gua: GuaLines;
    guaCode: string;
    guaName: string;
    question: string;
}): GuaHistoryRecord => ({
    id: createHistoryId(params.createdAt, params.guaCode),
    question: params.question,
    createdAt: params.createdAt,
    lines: params.gua,
    guaCode: params.guaCode,
    guaName: params.guaName,
});

const emptyCastingState = () => ({
    castingId: undefined,
    question: '',
    createdAt: '',
    step: 'init' as CastingStep,
    mode: undefined,
    gua: createEmptyGua(),
    baseReadingCompleted: false,
    baseReadingResult: undefined,
});

const useCastingSession = () => {
    const timerRef = useRef<number>();
    const submitLinesRef = useRef<string>();
    const startPromiseRef = useRef<Promise<string | undefined>>();
    const [initialSnapshot] = useState(() => loadCurrentCastingSnapshot());
    const shouldClearStaleLocalCastingRef = useRef(
        !!initialSnapshot &&
            (!!initialSnapshot.castingId ||
                hasAnyYao(initialSnapshot.gua) ||
                initialSnapshot.step !== 'init'),
    );

    const [apiError, setApiError] = useState<string>();
    const [initializing, setInitializing] = useState(true);
    const [starting, setStarting] = useState(false);
    const [usageState, setUsageState] = useState<UsageState>({});
    const [castingId, setCastingId] = useState(initialSnapshot?.castingId);
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
    const [baseReadingResult, setBaseReadingResult] = useState<IGua>();
    const [historyRecords, setHistoryRecords] = useState<GuaHistoryRecord[]>(
        () => loadHistoryRecords(),
    );

    const localGuaCode = useMemo(() => guaToCode(gua), [gua]);
    const guaCode = baseReadingResult?.gua ?? localGuaCode;
    const isComplete = useMemo(() => isGuaComplete(gua), [gua]);
    const hasYao = useMemo(() => hasAnyYao(gua), [gua]);
    const nextYaoIndex = useMemo(() => getNextYaoIndexFromBottom(gua), [gua]);
    const isQuestionLocked = initializing || starting || step !== 'init';

    const applyUsage = useCallback((payload: UsageState) => {
        setUsageState({
            castingUsage: payload.castingUsage,
            detailReadingUsage: payload.detailReadingUsage,
        });
    }, []);

    const applyBackendCasting = useCallback((casting: BackendCasting) => {
        setCastingId(casting.castingId);
        setQuestionState(casting.question);
        setCreatedAt(casting.createdAt);
        setStep(getStepFromBackendCasting(casting));
        setMode(casting.mode);
        setGua(getLinesFromBackendCasting(casting));
        setBaseReadingCompleted(casting.status === 'base_reading_completed');
    }, []);

    useEffect(() => {
        let ignoreResult = false;

        getVisitorSession()
            .then((result) => {
                if (ignoreResult) {
                    return;
                }

                applyUsage(result);
                const currentCasting = result.currentCasting;
                if (isBackendCastingOpen(currentCasting)) {
                    applyBackendCasting(currentCasting);
                } else if (shouldClearStaleLocalCastingRef.current) {
                    const emptyState = emptyCastingState();
                    setCastingId(emptyState.castingId);
                    setQuestionState(emptyState.question);
                    setCreatedAt(emptyState.createdAt);
                    setStep(emptyState.step);
                    setMode(emptyState.mode);
                    setGua(emptyState.gua);
                    setBaseReadingCompleted(emptyState.baseReadingCompleted);
                    setBaseReadingResult(emptyState.baseReadingResult);
                    clearCurrentCastingSnapshot();
                    shouldClearStaleLocalCastingRef.current = false;
                }
                setApiError(undefined);
            })
            .catch((err: unknown) => {
                if (!ignoreResult) {
                    setApiError(
                        err instanceof Error ? err.message : '后端会话加载失败',
                    );
                }
            })
            .finally(() => {
                if (!ignoreResult) {
                    setInitializing(false);
                }
            });

        return () => {
            ignoreResult = true;
        };
    }, [applyBackendCasting, applyUsage]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (step === 'init' && !createdAt && !hasYao) {
            clearCurrentCastingSnapshot();
            return;
        }

        saveCurrentCastingSnapshot(
            createSnapshot({
                castingId,
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
        castingId,
        createdAt,
        gua,
        guaCode,
        hasYao,
        mode,
        question,
        step,
    ]);

    const ensureStarted = useCallback(
        async (nextMode: CastingMode) => {
            if (step === 'result') {
                return undefined;
            }

            if (castingId) {
                if (step === 'init') {
                    setStep('input');
                }
                setMode((currentMode) => currentMode ?? nextMode);
                setBaseReadingCompleted(false);
                return castingId;
            }

            if (startPromiseRef.current) {
                return startPromiseRef.current;
            }

            setStarting(true);
            const promise = createCasting({
                question,
                mode: nextMode,
            })
                .then((result) => {
                    applyUsage(result);
                    applyBackendCasting(result.casting);
                    setStep((currentStep) =>
                        currentStep === 'init'
                            ? getStepFromBackendCasting(result.casting)
                            : currentStep,
                    );
                    setBaseReadingCompleted(false);
                    setApiError(undefined);
                    return result.casting.castingId;
                })
                .catch((err: unknown) => {
                    setApiError(
                        err instanceof Error ? err.message : '起卦会话创建失败',
                    );
                    return undefined;
                })
                .finally(() => {
                    startPromiseRef.current = undefined;
                    setStarting(false);
                });

            startPromiseRef.current = promise;
            return promise;
        },
        [applyBackendCasting, applyUsage, castingId, question, step],
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
            void ensureStarted(nextMode);
        },
        [ensureStarted],
    );

    const setYaoAt = useCallback(
        (index: number, value: number | null) => {
            if (!isValidYaoValue(value) || isComplete) {
                return;
            }

            void ensureStarted('manual').then((nextCastingId) => {
                if (!nextCastingId) {
                    return;
                }

                setGua((currentGua) =>
                    updateYaoAtIndex(currentGua, index, value),
                );
            });
        },
        [ensureStarted, isComplete],
    );

    const castCoins = useCallback(() => {
        if (animating || isComplete) {
            return;
        }

        setAnimating(true);
        void ensureStarted('online').then((nextCastingId) => {
            if (!nextCastingId) {
                setAnimating(false);
                return;
            }

            timerRef.current = window.setTimeout(() => {
                const nextCoins: CoinValue[] = [
                    coinFlip(),
                    coinFlip(),
                    coinFlip(),
                ];
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
        });
    }, [animating, ensureStarted, isComplete]);

    useEffect(() => {
        if (!castingId || !isComplete || baseReadingCompleted) {
            return;
        }

        const linesKey = `${castingId}:${guaToLinesFromBottom(gua).join(',')}`;
        if (submitLinesRef.current === linesKey) {
            return;
        }
        submitLinesRef.current = linesKey;

        updateCastingLines(castingId, guaToLinesFromBottom(gua))
            .then((result) => {
                applyUsage(result);
                applyBackendCasting(result.casting);
                setBaseReadingResult(result.baseReading);
                setHistoryRecords(
                    upsertHistoryRecord(
                        createHistoryRecord({
                            createdAt,
                            gua,
                            guaCode: result.baseReading.gua,
                            guaName: result.baseReading.name,
                            question,
                        }),
                    ),
                );
                setApiError(undefined);
            })
            .catch((err: unknown) => {
                submitLinesRef.current = undefined;
                setApiError(
                    err instanceof Error ? err.message : '基础解卦提交失败',
                );
            });
    }, [
        applyBackendCasting,
        applyUsage,
        baseReadingCompleted,
        castingId,
        createdAt,
        gua,
        isComplete,
        question,
    ]);

    const resetLocalCasting = useCallback(() => {
        setAnimating(false);
        setStarting(false);
        setCoins(DEFAULT_COINS);
        const emptyState = emptyCastingState();
        setCastingId(emptyState.castingId);
        setQuestionState(emptyState.question);
        setCreatedAt(emptyState.createdAt);
        setStep(emptyState.step);
        setMode(emptyState.mode);
        setGua(emptyState.gua);
        setBaseReadingCompleted(emptyState.baseReadingCompleted);
        setBaseReadingResult(emptyState.baseReadingResult);
        submitLinesRef.current = undefined;
        clearCurrentCastingSnapshot();
    }, []);

    const restart = useCallback(() => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = undefined;
        }

        if (!castingId) {
            resetLocalCasting();
            return;
        }

        restartCasting(castingId)
            .then((result) => {
                applyUsage(result);
                resetLocalCasting();
                setApiError(undefined);
            })
            .catch((err: unknown) => {
                setApiError(err instanceof Error ? err.message : '重新起卦失败');
            });
    }, [applyUsage, castingId, resetLocalCasting]);

    const markBaseReadingCompleted = useCallback(
        (guaResult: IGua) => {
            if (!createdAt || !guaCode || !isComplete) {
                return;
            }

            setBaseReadingCompleted(true);
            setBaseReadingResult((current) => current ?? guaResult);

            setHistoryRecords(
                upsertHistoryRecord(
                    createHistoryRecord({
                        createdAt,
                        gua,
                        guaCode,
                        guaName: guaResult.name,
                        question,
                    }),
                ),
            );
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
        setCastingId(undefined);
        setQuestionState(record.question);
        setCreatedAt(record.createdAt);
        setStep('result');
        setMode(undefined);
        setGua(record.lines);
        setBaseReadingCompleted(true);
        setBaseReadingResult(undefined);
    }, []);

    const clearHistory = useCallback(() => {
        clearHistoryRecords();
        setHistoryRecords([]);
    }, []);

    return {
        animating,
        apiError,
        baseReadingCompleted,
        baseReadingResult,
        castCoins,
        castingId,
        castingUsage: usageState.castingUsage,
        clearHistory,
        coins,
        createdAt,
        detailReadingUsage: usageState.detailReadingUsage,
        gua,
        guaCode,
        hasYao,
        historyRecords,
        initializing,
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
        starting,
        step,
    };
};

export { useCastingSession };
