import { Typography } from 'antd';
import _ from 'lodash';
import { steps } from '../../../utils/constant';
const InitMsg = () => {
    return (
        <div>
            <Typography.Title>相由心生 心诚则灵</Typography.Title>
            <Typography.Title level={5}>
                ————根据曾仕强先生的硬币卜卦法制作
            </Typography.Title>
            <Typography.Title level={4}>算卦步骤: </Typography.Title>
            <Typography.Paragraph>
                <ol>
                    {_.map(steps, (step, idx) => (
                        <li key={idx}>{step}</li>
                    ))}
                </ol>
            </Typography.Paragraph>
        </div>
    );
};

export default InitMsg;
