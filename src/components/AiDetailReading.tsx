import { Button, Drawer, Tooltip, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import {
    createAiDetailReading,
    createCastingDetailReading,
    getCastingDetailReading,
} from '../services/detailReading';
import { DetailReadingResult, GuaLines, UsageSummary } from '../types';

const ReadingList = (props: { items: string[] }) => (
    <ul>
        {props.items.map((item, idx) => (
            <li key={`${idx}-${item}`}>{item}</li>
        ))}
    </ul>
);

const AiDetailReading = (props: {
    castingId?: string;
    gua: GuaLines;
    guaCode?: string;
    question: string;
    usage?: UsageSummary;
}) => {
    const { castingId, gua, guaCode, question, usage } = props;
    const trimmedQuestion = question.trim();
    const hasQuestion = trimmedQuestion.length > 0;
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [remaining, setRemaining] = useState<number | undefined>(
        usage?.remaining,
    );
    const [result, setResult] = useState<DetailReadingResult>();
    const detailAllowed = usage?.allowed !== false || !!result;
    const disabledReason = !guaCode
        ? '请先完成六爻后再生成 AI 详细解卦'
        : !hasQuestion
          ? '需填写所问之事后才能生成 AI 详细解卦'
          : !detailAllowed
            ? '今日详细解卦次数已用完，请明日再来'
            : undefined;

    useEffect(() => {
        setDrawerOpen(false);
        setLoading(false);
        setRemaining(usage?.remaining);
        setResult(undefined);
    }, [castingId, guaCode, question, usage?.remaining]);

    useEffect(() => {
        let ignoreResult = false;

        if (!castingId) {
            return () => {
                ignoreResult = true;
            };
        }

        getCastingDetailReading(castingId)
            .then((response) => {
                if (ignoreResult) {
                    return;
                }

                if (response.result) {
                    setResult(response.result);
                }
                if (response.usage) {
                    setRemaining(response.usage.remaining);
                }
            })
            .catch(() => {
                // Missing cached AI result should not block the base reading UI.
            });

        return () => {
            ignoreResult = true;
        };
    }, [castingId]);

    const handleGenerate = async () => {
        if (result) {
            setDrawerOpen(true);
            return;
        }

        if (!guaCode || !hasQuestion || loading || !detailAllowed) {
            return;
        }

        setLoading(true);

        try {
            const response = castingId
                ? await createCastingDetailReading(castingId)
                : await createAiDetailReading({
                      question: trimmedQuestion,
                      guaCode,
                      gua,
                  });
            setResult(response.result);
            setRemaining(response.usage?.remaining);
            setDrawerOpen(true);
        } catch (err: unknown) {
            message.error(
                err instanceof Error ? err.message : 'AI 详细解卦失败',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Tooltip title={disabledReason}>
                <Button
                    type="primary"
                    disabled={!!disabledReason}
                    loading={loading}
                    onClick={handleGenerate}
                >
                    {result ? '查看 AI 解卦' : 'AI 解卦'}
                </Button>
            </Tooltip>
            <Drawer
                className="aiDetailDrawer"
                title="AI 解卦"
                width={520}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            >
                {remaining !== undefined && (
                    <Typography.Text type="secondary">
                        今日剩余 {remaining} 次
                    </Typography.Text>
                )}
                {result && (
                    <div className="aiDetailResult">
                        <Typography.Title level={5}>
                            {result.title}
                        </Typography.Title>
                        <Typography.Paragraph>
                            <Typography.Text type="secondary">
                                {result.questionSummary}
                            </Typography.Text>
                        </Typography.Paragraph>
                        <Typography.Paragraph>
                            <Typography.Text>
                                {result.overallJudgement}
                            </Typography.Text>
                        </Typography.Paragraph>
                        <Typography.Text strong>关键建议</Typography.Text>
                        <ReadingList items={result.keyAdvice} />
                        <Typography.Text strong>风险提醒</Typography.Text>
                        <ReadingList items={result.risks} />
                        <Typography.Text strong>行动建议</Typography.Text>
                        <ReadingList items={result.actionItems} />
                    </div>
                )}
            </Drawer>
        </>
    );
};

export default AiDetailReading;
