import { CastingMode, IGua, UsageSummary, YaoValue } from '../types';
import { requestJson } from './api';

type CastingStatus =
    | 'casting'
    | 'base_reading_loading'
    | 'base_reading_completed'
    | 'closed'
    | 'expired';

interface BackendCasting {
    castingId: string;
    question: string;
    mode: CastingMode;
    lines: number[] | null;
    guaCode: string | null;
    status: CastingStatus;
    createdAt: string;
    updatedAt: string;
    completedAt: string | null;
    closedAt: string | null;
}

interface UsagePayload {
    castingUsage: UsageSummary;
    detailReadingUsage: UsageSummary;
}

interface VisitorSessionResponse extends UsagePayload {
    currentCasting: BackendCasting | null;
}

interface CreateCastingResponse extends UsagePayload {
    casting: BackendCasting;
    reused: boolean;
}

interface UpdateCastingLinesResponse extends UsagePayload {
    casting: BackendCasting;
    baseReading: IGua;
}

interface RestartCastingResponse extends UsagePayload {
    casting: BackendCasting;
}

const getVisitorSession = () =>
    requestJson<VisitorSessionResponse>(
        '/api/visitor/session',
        { method: 'GET' },
        '后端会话加载失败',
    );

const createCasting = (params: { question: string; mode: CastingMode }) =>
    requestJson<CreateCastingResponse>(
        '/api/castings',
        {
            method: 'POST',
            body: JSON.stringify(params),
        },
        '起卦会话创建失败',
    );

const updateCastingLines = (castingId: string, lines: YaoValue[]) =>
    requestJson<UpdateCastingLinesResponse>(
        `/api/castings/${castingId}/lines`,
        {
            method: 'PATCH',
            body: JSON.stringify({ lines }),
        },
        '基础解卦提交失败',
    );

const restartCasting = (castingId: string) =>
    requestJson<RestartCastingResponse>(
        `/api/castings/${castingId}/restart`,
        { method: 'POST' },
        '重新起卦失败',
    );

export {
    createCasting,
    getVisitorSession,
    restartCasting,
    updateCastingLines,
};
export type { BackendCasting, UsagePayload };
