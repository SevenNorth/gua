import { Typography } from 'antd';
import { IGua } from '../types';

/** 展示解卦结果，同时处理加载中与加载失败状态。 */
const GuaExplain = (props: {
    error?: string;
    guaResult?: IGua;
    loading: boolean;
}) => {
    const { error, guaResult, loading } = props;

    if (loading) {
        return (
            <Typography.Paragraph>
                <Typography.Text>解卦数据加载中...</Typography.Text>
            </Typography.Paragraph>
        );
    }

    if (error) {
        return (
            <Typography.Paragraph>
                <Typography.Text type="danger">{error}</Typography.Text>
            </Typography.Paragraph>
        );
    }

    if (!guaResult) {
        return null;
    }

    return (
        <>
            <Typography.Title level={5}>{guaResult.name}</Typography.Title>
            <Typography.Paragraph>
                <Typography.Text>{guaResult.info}</Typography.Text>
            </Typography.Paragraph>
            <Typography.Paragraph>
                <Typography.Text>{guaResult.intro}</Typography.Text>
            </Typography.Paragraph>
            <Typography.Paragraph>
                <ul>
                    {guaResult.explain.map((text, idx) => (
                        <li key={`${idx}-${text}`}>{text}</li>
                    ))}
                </ul>
            </Typography.Paragraph>
            <Typography.Paragraph>
                <Typography.Text>台湾张铭仁解卦：</Typography.Text>
            </Typography.Paragraph>
            {guaResult.external.slice(0, 2).map((text, idx) => (
                <Typography.Paragraph key={`${idx}-${text}`}>
                    <Typography.Text>{text}</Typography.Text>
                </Typography.Paragraph>
            ))}
            <Typography.Paragraph>
                <ul>
                    {guaResult.external.slice(2).map((text, idx) => (
                        <li key={`${idx}-${text}`}>{text}</li>
                    ))}
                </ul>
            </Typography.Paragraph>
        </>
    );
};

export default GuaExplain;
