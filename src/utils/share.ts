import { IGua, GuaHistoryRecord, GuaLines } from '../types';

const formatDateTime = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString();
};

const formatLinesFromBottom = (lines: GuaLines) =>
    [...lines].reverse().map((line) => line ?? '-').join(', ');

const buildGuaShareText = (params: {
    question: string;
    createdAt: string;
    lines: GuaLines;
    guaCode?: string;
    guaResult?: IGua;
}) => {
    const { question, createdAt, lines, guaCode, guaResult } = params;

    return [
        '问爻起卦结果',
        `所问之事：${question.trim() || '未填写'}`,
        `起卦时间：${formatDateTime(createdAt)}`,
        `卦名：${guaResult?.name ?? '未加载'}`,
        `卦象：${guaResult?.info ?? '未加载'}`,
        `卦码：${guaCode ?? '未生成'}`,
        `六爻结果（初爻到上爻）：${formatLinesFromBottom(lines)}`,
    ].join('\n');
};

const buildHistoryShareText = (record: GuaHistoryRecord) =>
    [
        '问爻起卦结果',
        `所问之事：${record.question.trim() || '未填写'}`,
        `起卦时间：${formatDateTime(record.createdAt)}`,
        `卦名：${record.guaName}`,
        `卦码：${record.guaCode}`,
        `六爻结果（初爻到上爻）：${formatLinesFromBottom(record.lines)}`,
    ].join('\n');

const copyText = async (text: string) => {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
        document.execCommand('copy');
    } finally {
        document.body.removeChild(textarea);
    }
};

export {
    buildGuaShareText,
    buildHistoryShareText,
    copyText,
    formatDateTime,
    formatLinesFromBottom,
};
