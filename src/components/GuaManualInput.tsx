import { Form, InputNumber } from 'antd';
import { GuaLines } from '../types';

/** 手动录入六爻结果，输入顺序与页面卦象展示顺序一致。 */
const GuaManualInput = (props: {
    disabled: boolean;
    gua: GuaLines;
    labelColSpan: number;
    onChange: (index: number, value: number | null) => void;
    wrapperColSpan: number;
}) => {
    const { disabled, gua, labelColSpan, onChange, wrapperColSpan } = props;

    return (
        <div className="inputBox">
            {gua.map((yao, idx) => {
                return (
                    <Form.Item
                        labelCol={{ span: labelColSpan }}
                        wrapperCol={{ span: wrapperColSpan }}
                        key={idx}
                        label={`爻 ${6 - idx}`}
                        rules={[
                            {
                                required: true,
                                message: '请输入爻值',
                            },
                        ]}
                    >
                        <InputNumber
                            disabled={disabled}
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
