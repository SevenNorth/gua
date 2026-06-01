import { Typography } from 'antd';
import { CoinValue, GuaLines } from '../types';
import {
    getYaoNameByDisplayIndex,
    getYaoOrderByDisplayIndex,
    isValidYaoValue,
    sumCoins,
} from '../utils/gua';

const CastingProgressHint = (props: {
    animating?: boolean;
    coins?: CoinValue[];
    gua: GuaLines;
    nextYaoIndex?: number;
}) => {
    const { animating, coins, gua, nextYaoIndex } = props;

    if (nextYaoIndex !== undefined) {
        return (
            <Typography.Paragraph className="castingProgressHint">
                <Typography.Text strong>
                    {animating ? '正在生成' : '当前待填写'}
                    {getYaoNameByDisplayIndex(nextYaoIndex)}
                </Typography.Text>
                <Typography.Text type="secondary">
                    {' '}
                    第 {getYaoOrderByDisplayIndex(nextYaoIndex)} 次，从下往上起卦
                </Typography.Text>
            </Typography.Paragraph>
        );
    }

    if (coins && coins.length === 3) {
        const total = sumCoins(coins);
        return (
            <Typography.Paragraph className="castingProgressHint">
                <Typography.Text strong>
                    六爻已完成，三枚硬币最后结果：{coins.join(' + ')} = {total}
                </Typography.Text>
                <Typography.Text type="secondary">
                    {' '}
                    {isValidYaoValue(total) && total % 2 === 0 ? '阴爻' : '阳爻'}
                </Typography.Text>
            </Typography.Paragraph>
        );
    }

    if (gua.every((line) => line !== undefined)) {
        return (
            <Typography.Paragraph className="castingProgressHint">
                <Typography.Text strong>六爻已完成，正在进入解卦。</Typography.Text>
            </Typography.Paragraph>
        );
    }

    return null;
};

export default CastingProgressHint;
