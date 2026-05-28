import { Typography } from 'antd';
import { steps } from '../utils/constant';

/** 展示应用标题、来源说明和起卦步骤。 */
const GuaIntro = () => {
    return (
        <div className="headerBox">
            <Typography.Title>相由心生 心诚则灵</Typography.Title>
            <Typography.Title level={5}>
                ————根据曾仕强先生的硬币卜卦法制作
            </Typography.Title>
            <Typography.Title level={4}>算卦步骤: </Typography.Title>
            <Typography.Paragraph>
                <ol>
                    {steps.map((step, idx) => (
                        <li key={`${idx}-${step}`}>{step}</li>
                    ))}
                </ol>
            </Typography.Paragraph>
        </div>
    );
};

export default GuaIntro;
