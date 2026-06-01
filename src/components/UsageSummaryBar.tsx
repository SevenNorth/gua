import { Tag, Tooltip, Typography } from 'antd';
import { UsageSummary } from '../types';
import { formatDateTime } from '../utils/share';

const formatResetTime = (usage?: UsageSummary) =>
    usage?.nextResetAt ? formatDateTime(usage.nextResetAt) : undefined;

const UsageSummaryBar = (props: {
    castingUsage?: UsageSummary;
    className?: string;
    detailReadingUsage?: UsageSummary;
}) => {
    const { castingUsage, className, detailReadingUsage } = props;

    if (!castingUsage && !detailReadingUsage) {
        return null;
    }

    return (
        <div className={className ? `usageSummary ${className}` : 'usageSummary'}>
            {castingUsage && (
                <Tooltip title={`明日恢复：${formatResetTime(castingUsage) ?? '未知'}`}>
                    <Tag color={castingUsage.allowed ? 'blue' : 'red'}>
                        起卦剩余 {castingUsage.remaining} 次
                    </Tag>
                </Tooltip>
            )}
            {detailReadingUsage && (
                <Tooltip
                    title={`明日恢复：${
                        formatResetTime(detailReadingUsage) ?? '未知'
                    }`}
                >
                    <Tag color={detailReadingUsage.allowed ? 'green' : 'red'}>
                        AI 解卦剩余 {detailReadingUsage.remaining} 次
                    </Tag>
                </Tooltip>
            )}
            {castingUsage && !castingUsage.allowed && (
                <Typography.Text type="danger">
                    今日起卦次数已用完，请明日再来。
                </Typography.Text>
            )}
        </div>
    );
};

export default UsageSummaryBar;
