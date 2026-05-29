import {
    CastingMode,
    CastingSnapshot,
    CastingStep,
    GuaHistoryRecord,
    GuaLines,
    YaoValue,
} from '../types';
import { createEmptyGua, guaToCode, isValidYaoValue } from './gua';

const CURRENT_CASTING_KEY = 'wenyao.currentCasting.v1';
const HISTORY_KEY = 'wenyao.history.v1';
const SNAPSHOT_VERSION = 1;
const MAX_HISTORY_COUNT = 20;

type StoredGuaLine = YaoValue | null;

interface StoredCastingSnapshot {
    version: 1;
    castingId?: string;
    question: string;
    createdAt: string;
    step: CastingStep;
    mode?: CastingMode;
    gua: StoredGuaLine[];
    guaCode?: string;
    baseReadingCompleted: boolean;
}

interface StoredGuaHistoryRecord {
    id: string;
    question: string;
    createdAt: string;
    lines: StoredGuaLine[];
    guaCode: string;
    guaName: string;
}

const isBrowser = () => typeof window !== 'undefined' && !!window.localStorage;

const toStoredLines = (gua: GuaLines): StoredGuaLine[] =>
    gua.map((line) => (line === undefined ? null : line));

const fromStoredLines = (lines: unknown): GuaLines | undefined => {
    if (!Array.isArray(lines) || lines.length !== 6) {
        return undefined;
    }

    const gua = lines.map((line) => {
        if (line === null || line === undefined) {
            return undefined;
        }

        if (isValidYaoValue(line)) {
            return line;
        }

        return null;
    });

    if (gua.some((line) => line === null)) {
        return undefined;
    }

    return gua as GuaLines;
};

const isCastingStep = (value: unknown): value is CastingStep =>
    value === 'init' || value === 'input' || value === 'result';

const isCastingMode = (value: unknown): value is CastingMode =>
    value === 'online' || value === 'manual';

const parseJson = (value: string | null): unknown => {
    if (!value) {
        return undefined;
    }

    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
};

const loadCurrentCastingSnapshot = (): CastingSnapshot | undefined => {
    if (!isBrowser()) {
        return undefined;
    }

    const parsed = parseJson(window.localStorage.getItem(CURRENT_CASTING_KEY));

    if (!parsed || typeof parsed !== 'object') {
        return undefined;
    }

    const snapshot = parsed as Partial<StoredCastingSnapshot>;
    const gua = fromStoredLines(snapshot.gua);

    if (
        snapshot.version !== SNAPSHOT_VERSION ||
        typeof snapshot.question !== 'string' ||
        typeof snapshot.createdAt !== 'string' ||
        !isCastingStep(snapshot.step) ||
        !gua ||
        typeof snapshot.baseReadingCompleted !== 'boolean'
    ) {
        clearCurrentCastingSnapshot();
        return undefined;
    }

    if (snapshot.mode !== undefined && !isCastingMode(snapshot.mode)) {
        clearCurrentCastingSnapshot();
        return undefined;
    }

    const guaCode = guaToCode(gua);

    if (snapshot.guaCode !== undefined && snapshot.guaCode !== guaCode) {
        clearCurrentCastingSnapshot();
        return undefined;
    }

    return {
        version: SNAPSHOT_VERSION,
        castingId:
            typeof snapshot.castingId === 'string'
                ? snapshot.castingId
                : undefined,
        question: snapshot.question,
        createdAt: snapshot.createdAt,
        step: snapshot.step,
        mode: snapshot.mode,
        gua,
        guaCode,
        baseReadingCompleted: snapshot.baseReadingCompleted,
    };
};

const saveCurrentCastingSnapshot = (snapshot: CastingSnapshot) => {
    if (!isBrowser()) {
        return;
    }

    const storedSnapshot: StoredCastingSnapshot = {
        ...snapshot,
        version: SNAPSHOT_VERSION,
        gua: toStoredLines(snapshot.gua),
    };

    window.localStorage.setItem(
        CURRENT_CASTING_KEY,
        JSON.stringify(storedSnapshot),
    );
};

const clearCurrentCastingSnapshot = () => {
    if (!isBrowser()) {
        return;
    }

    window.localStorage.removeItem(CURRENT_CASTING_KEY);
};

const isHistoryRecord = (value: unknown): value is StoredGuaHistoryRecord => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const record = value as Partial<StoredGuaHistoryRecord>;
    const lines = fromStoredLines(record.lines);

    return (
        typeof record.id === 'string' &&
        typeof record.question === 'string' &&
        typeof record.createdAt === 'string' &&
        !!lines &&
        typeof record.guaCode === 'string' &&
        guaToCode(lines) === record.guaCode &&
        typeof record.guaName === 'string'
    );
};

const loadHistoryRecords = (): GuaHistoryRecord[] => {
    if (!isBrowser()) {
        return [];
    }

    const parsed = parseJson(window.localStorage.getItem(HISTORY_KEY));

    if (!Array.isArray(parsed)) {
        return [];
    }

    return parsed
        .filter(isHistoryRecord)
        .map((record) => ({
            ...record,
            lines: fromStoredLines(record.lines) ?? createEmptyGua(),
        }))
        .slice(0, MAX_HISTORY_COUNT);
};

const saveHistoryRecords = (records: GuaHistoryRecord[]) => {
    if (!isBrowser()) {
        return;
    }

    const storedRecords: StoredGuaHistoryRecord[] = records
        .slice(0, MAX_HISTORY_COUNT)
        .map((record) => ({
            ...record,
            lines: toStoredLines(record.lines),
        }));

    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(storedRecords));
};

const upsertHistoryRecord = (
    record: GuaHistoryRecord,
): GuaHistoryRecord[] => {
    const records = loadHistoryRecords();
    const nextRecords = [
        record,
        ...records.filter((item) => item.id !== record.id),
    ].slice(0, MAX_HISTORY_COUNT);

    saveHistoryRecords(nextRecords);
    return nextRecords;
};

const clearHistoryRecords = () => {
    if (!isBrowser()) {
        return;
    }

    window.localStorage.removeItem(HISTORY_KEY);
};

export {
    clearCurrentCastingSnapshot,
    clearHistoryRecords,
    loadCurrentCastingSnapshot,
    loadHistoryRecords,
    saveCurrentCastingSnapshot,
    upsertHistoryRecord,
};
