import { Button, Empty, List, Popconfirm, Space, Typography, message } from 'antd';
import { GuaHistoryRecord } from '../types';
import {
    buildHistoryShareText,
    copyText,
    formatDateTime,
} from '../utils/share';

const HistoryPanel = (props: {
    disableOpen?: boolean;
    records: GuaHistoryRecord[];
    onClear: () => void;
    onOpen: (record: GuaHistoryRecord) => void;
}) => {
    const { disableOpen, records, onClear, onOpen } = props;

    const handleCopy = async (record: GuaHistoryRecord) => {
        try {
            await copyText(buildHistoryShareText(record));
            message.success('已复制历史结果');
        } catch {
            message.error('复制失败，请稍后重试');
        }
    };

    if (records.length === 0) {
        return <Empty description="暂无历史记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
    }

    return (
        <>
            <List
                size="small"
                dataSource={records}
                renderItem={(record) => (
                    <List.Item
                        actions={[
                            <Button
                                disabled={disableOpen}
                                key="open"
                                size="small"
                                type="link"
                                onClick={() => onOpen(record)}
                            >
                                打开
                            </Button>,
                            <Button
                                key="copy"
                                size="small"
                                type="link"
                                onClick={() => void handleCopy(record)}
                            >
                                复制
                            </Button>,
                        ]}
                    >
                        <List.Item.Meta
                            title={`${record.guaName} · ${formatDateTime(
                                record.createdAt,
                            )}`}
                            description={
                                <Typography.Text ellipsis>
                                    {record.question.trim() || '未填写所问之事'}
                                </Typography.Text>
                            }
                        />
                    </List.Item>
                )}
            />
            <Space className="historyActions">
                <Popconfirm
                    title="清空历史记录？"
                    okText="清空"
                    cancelText="取消"
                    onConfirm={onClear}
                >
                    <Button size="small">清空历史记录</Button>
                </Popconfirm>
            </Space>
        </>
    );
};

export default HistoryPanel;
