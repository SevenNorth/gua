import { Form, InputNumber, Typography } from 'antd';
import { GuaLines } from '../types';
import {
    getYaoNameByDisplayIndex,
    getYaoOrderByDisplayIndex,
} from '../utils/gua';

/** 手动录入六爻结果，输入顺序与页面卦象展示顺序一致。 */
const GuaManualInput = (props: {
    activeIndex?: number;
    disabled: boolean;
    disabledReason?: string;
    gua: GuaLines;
    labelColSpan: number;
    onChange: (index: number, value: number | null) => void;
    wrapperColSpan: number;
}) => {
    const {
        activeIndex,
        disabled,
        disabledReason,
        gua,
        labelColSpan,
        onChange,
        wrapperColSpan,
    } = props;

    return (
        <div className="inputBox">
            <Typography.Paragraph type="secondary" className="inputHint">
                请从初爻开始，按从下到上的顺序填写。
            </Typography.Paragraph>
            {gua.map((yao, idx) => {
                const isCurrentInput = idx === activeIndex;
                const yaoName = getYaoNameByDisplayIndex(idx);
                return (
                    <Form.Item
                        labelCol={{ span: labelColSpan }}
                        wrapperCol={{ span: wrapperColSpan }}
                        key={idx}
                        label={`${
                            idx === activeIndex ? '当前：' : ''
                        }${yaoName}`}
                        extra={
                            isCurrentInput
                                ? disabledReason ??
                                  `第 ${getYaoOrderByDisplayIndex(
                                      idx,
                                  )} 次抛掷结果`
                                : undefined
                        }
                        rules={[
                            {
                                required: true,
                                message: '请输入爻值',
                            },
                        ]}
                    >
                        <InputNumber
                            disabled={
                                disabled || !isCurrentInput || yao !== undefined
                            }
                            value={yao}
                            min={6}
                            max={9}
                            precision={0}
                            step={1}
                            onChange={(value) => {
                                onChange(
                                    idx,
                                    typeof value === 'number' ? value : null,
                                );
                            }}
                        />
                    </Form.Item>
                );
            })}
        </div>
    );
};

export default GuaManualInput;
