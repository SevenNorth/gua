/** 解卦数据文件解码后的结构。 */
export interface IGua {
    gua: string;
    name: string;
    info: string;
    intro: string;
    explain: string[];
    external: string[];
}

/** 单枚硬币结果：背面为 2，正面为 3。 */
export type CoinValue = 2 | 3;

/** 三枚硬币相加后得到的一爻结果。 */
export type YaoValue = 6 | 7 | 8 | 9;

/** 页面按从上到下的显示顺序存放六爻，未完成的爻为 undefined。 */
export type GuaLines = Array<YaoValue | undefined>;

/** 起卦模式：在线抛硬币或手动录入真实硬币结果。 */
export type CastingMode = 'online' | 'manual';

/** 当前起卦流程所在步骤。 */
export type CastingStep = 'init' | 'input' | 'result';

/** 当前起卦流程快照，用于刷新页面后恢复状态。 */
export interface CastingSnapshot {
    version: 1;
    castingId?: string;
    question: string;
    createdAt: string;
    step: CastingStep;
    mode?: CastingMode;
    gua: GuaLines;
    guaCode?: string;
    baseReadingCompleted: boolean;
}

/** 本地历史记录，保存最近完成基础解卦的起卦结果。 */
export interface GuaHistoryRecord {
    id: string;
    question: string;
    createdAt: string;
    lines: GuaLines;
    guaCode: string;
    guaName: string;
}

/** AI 详细解卦返回内容。 */
export interface DetailReadingResult {
    title: string;
    questionCategory?: string;
    questionSummary: string;
    overallJudgement: string;
    keyAdvice: string[];
    risks: string[];
    actionItems: string[];
}

/** 后端每日次数摘要。 */
export interface UsageSummary {
    date: string;
    used: number;
    remaining: number;
    allowed: boolean;
    nextResetAt: string;
    updatedAt: string;
}

/** 后端次数状态。 */
export interface UsageState {
    castingUsage?: UsageSummary;
    detailReadingUsage?: UsageSummary;
}
