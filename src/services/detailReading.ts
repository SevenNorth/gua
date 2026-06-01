import { DetailReadingResult, GuaLines, UsageSummary, YaoValue } from '../types';
import { isValidYaoValue } from '../utils/gua';
import { requestJson } from './api';

interface DetailReadingResponse {
    detailReading: {
        status: string;
        result?: unknown;
    } | null;
    detailReadingUsage?: UsageSummary;
}

const isStringArray = (value: unknown): value is string[] => {
    return (
        Array.isArray(value) &&
        value.every((item) => typeof item === 'string')
    );
};

const isDetailReadingResult = (
    value: unknown,
): value is DetailReadingResult => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const result = value as Partial<DetailReadingResult>;
    return (
        typeof result.title === 'string' &&
        (result.questionCategory === undefined ||
            typeof result.questionCategory === 'string') &&
        typeof result.questionSummary === 'string' &&
        typeof result.overallJudgement === 'string' &&
        isStringArray(result.keyAdvice) &&
        isStringArray(result.risks) &&
        isStringArray(result.actionItems)
    );
};

const toLinesFromBottom = (gua: GuaLines): YaoValue[] => {
    const lines = [...gua].reverse();

    if (!lines.every(isValidYaoValue)) {
        throw new Error('请先完成六爻后再生成 AI 详细解卦');
    }

    return lines;
};

const createAiDetailReading = async (params: {
    question: string;
    guaCode: string;
    gua: GuaLines;
}): Promise<{
    result: DetailReadingResult;
    usage?: UsageSummary;
}> => {
    const body = await requestJson<DetailReadingResponse>(
        '/api/ai-detail-reading',
        {
            method: 'POST',
            body: JSON.stringify({
                question: params.question,
                guaCode: params.guaCode,
                lines: toLinesFromBottom(params.gua),
            }),
        },
        'AI 详细解卦生成失败',
    );
    const result = body.detailReading?.result;

    if (!isDetailReadingResult(result)) {
        throw new Error('AI 详细解卦返回数据不完整');
    }

    return {
        result,
        usage: body.detailReadingUsage,
    };
};

const createCastingDetailReading = async (
    castingId: string,
): Promise<{
    result: DetailReadingResult;
    usage?: UsageSummary;
}> => {
    const body = await requestJson<DetailReadingResponse>(
        `/api/castings/${castingId}/detail-reading`,
        { method: 'POST' },
        'AI 详细解卦生成失败',
    );
    const result = body.detailReading?.result;

    if (!isDetailReadingResult(result)) {
        throw new Error('AI 详细解卦返回数据不完整');
    }

    return {
        result,
        usage: body.detailReadingUsage,
    };
};

const getCastingDetailReading = async (
    castingId: string,
): Promise<{
    result?: DetailReadingResult;
    status?: string;
    usage?: UsageSummary;
}> => {
    const body = await requestJson<DetailReadingResponse>(
        `/api/castings/${castingId}/detail-reading`,
        { method: 'GET' },
        'AI 详细解卦加载失败',
    );

    const result = body.detailReading?.result;
    if (result !== undefined && !isDetailReadingResult(result)) {
        throw new Error('AI 详细解卦返回数据不完整');
    }

    return {
        result,
        status: body.detailReading?.status,
        usage: body.detailReadingUsage,
    };
};

export {
    createAiDetailReading,
    createCastingDetailReading,
    getCastingDetailReading,
};
