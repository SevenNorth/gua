import { DetailReadingResult, GuaLines, UsageSummary, YaoValue } from '../types';
import { isValidYaoValue } from '../utils/gua';

interface DetailReadingResponse {
    detailReading: {
        status: string;
        result?: unknown;
    };
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

const getApiErrorMessage = async (response: Response): Promise<string> => {
    try {
        const body: unknown = await response.json();
        if (body && typeof body === 'object') {
            const error = (body as { error?: { message?: unknown } }).error;
            if (typeof error?.message === 'string') {
                return error.message;
            }
        }
    } catch {
        return 'AI 详细解卦生成失败';
    }

    return 'AI 详细解卦生成失败';
};

const createAiDetailReading = async (params: {
    question: string;
    guaCode: string;
    gua: GuaLines;
}): Promise<{
    result: DetailReadingResult;
    usage?: UsageSummary;
}> => {
    const response = await fetch('/api/ai-detail-reading', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            question: params.question,
            guaCode: params.guaCode,
            lines: toLinesFromBottom(params.gua),
        }),
    });

    if (!response.ok) {
        throw new Error(await getApiErrorMessage(response));
    }

    const body = (await response.json()) as DetailReadingResponse;
    const result = body.detailReading?.result;

    if (!isDetailReadingResult(result)) {
        throw new Error('AI 详细解卦返回数据不完整');
    }

    return {
        result,
        usage: body.detailReadingUsage,
    };
};

export { createAiDetailReading };
