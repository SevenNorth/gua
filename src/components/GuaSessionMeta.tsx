import { Descriptions, Typography } from 'antd';
import { formatDateTime } from '../utils/share';

const GuaSessionMeta = (props: { question: string; createdAt: string }) => {
    const { question, createdAt } = props;

    if (!createdAt) {
        return null;
    }

    return (
        <Descriptions column={1} size="small" className="sessionMeta">
            <Descriptions.Item label="所问之事">
                <Typography.Text>{question.trim() || '未填写'}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="起卦时间">
                <Typography.Text>{formatDateTime(createdAt)}</Typography.Text>
            </Descriptions.Item>
        </Descriptions>
    );
};

export default GuaSessionMeta;
