import { useEffect } from 'react';
import { Button, Divider, Space, Typography, message } from 'antd';
import GuaExplain from '../../../components/GuaExplain';
import GuaGraph from '../../../components/GuaGraph';
import GuaSessionMeta from '../../../components/GuaSessionMeta';
import { useGuaExplain } from '../../../hooks/useGuaExplain';
import { GuaLines, IGua } from '../../../types';
import { buildGuaShareText, copyText } from '../../../utils/share';

const GuaResult = (props: {
    baseReadingCompleted: boolean;
    createdAt: string;
    gua: GuaLines;
    guaCode: string | undefined;
    markBaseReadingCompleted: (guaResult: IGua) => void;
    question: string;
    restart: () => void;
}) => {
    const {
        baseReadingCompleted,
        createdAt,
        gua,
        guaCode,
        markBaseReadingCompleted,
        question,
        restart,
    } = props;
    const { error, guaResult, loading } = useGuaExplain(guaCode);

    useEffect(() => {
        if (guaResult && !baseReadingCompleted) {
            markBaseReadingCompleted(guaResult);
        }
    }, [baseReadingCompleted, guaResult, markBaseReadingCompleted]);

    const handleCopy = async () => {
        try {
            await copyText(
                buildGuaShareText({
                    question,
                    createdAt,
                    lines: gua,
                    guaCode,
                    guaResult,
                }),
            );
            message.success('已复制起卦结果');
        } catch {
            message.error('复制失败，请稍后重试');
        }
    };

    return (
        <div className="explainBox">
            <GuaGraph gua={gua} />
            <GuaSessionMeta createdAt={createdAt} question={question} />
            <Divider orientation="left">解卦</Divider>
            {!guaCode ? (
                <Typography.Paragraph>
                    <Typography.Text type="danger">
                        未找到起卦结果，请重新起卦。
                    </Typography.Text>
                </Typography.Paragraph>
            ) : (
                <GuaExplain
                    error={error}
                    guaResult={guaResult}
                    loading={loading}
                />
            )}
            {guaResult && (
                <Space className="resultActions">
                    <Button onClick={handleCopy}>复制结果</Button>
                    <Button onClick={restart}>再来一次</Button>
                </Space>
            )}
        </div>
    );
};

export default GuaResult;
