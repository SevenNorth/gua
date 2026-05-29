import { Button, Drawer, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import {
    createAiDetailReading,
    createCastingDetailReading,
} from '../services/detailReading';
import { DetailReadingResult, GuaLines } from '../types';

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
}) => {
    const { castingId, gua, guaCode, question } = props;
    const trimmedQuestion = question.trim();
    const hasQuestion = trimmedQuestion.length > 0;
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [remaining, setRemaining] = useState<number>();
    const [result, setResult] = useState<DetailReadingResult>();

    useEffect(() => {
        setDrawerOpen(false);
        setLoading(false);
        setRemaining(undefined);
        setResult(undefined);
    }, [castingId, guaCode, question]);

    const handleGenerate = async () => {
        if (result) {
            setDrawerOpen(true);
            return;
        }

        if (!guaCode || !hasQuestion || loading) {
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
            <Button
                type="primary"
                disabled={!guaCode || !hasQuestion}
                loading={loading}
                onClick={handleGenerate}
            >
                AI 解卦
            </Button>
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
