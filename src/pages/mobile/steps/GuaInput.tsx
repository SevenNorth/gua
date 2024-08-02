import { useEffect, useState } from 'react';
import _ from 'lodash';
import { coinFlip } from '../../../utils';
import front from '../../../assets/front.png';
import back from '../../../assets/back.png';
import { Button, Form, InputNumber, Space } from 'antd';
import { ISTEP } from '../MobileApp';

const GuaInput = (props: {
    hasCoins: boolean;
    setStep: React.Dispatch<React.SetStateAction<ISTEP>>;
    handleGuaRes: (s: string) => void;
}) => {
    const { hasCoins, setStep, handleGuaRes } = props;

    const [animating, setAnimating] = useState(false);
    const [yao, setYao] = useState<number[]>([3, 3, 3]);
    const [gua, setGua] = useState<number[]>(Array(6));

    useEffect(() => {
        if (_.every(gua, (yao) => !_.isUndefined(yao))) {
            const gua_str = _.reverse(_.map(gua, (y) => y % 2)).join('');
            setStep(ISTEP.RESULT);
            handleGuaRes(gua_str);
        }
    }, [gua]);

    const reset = () => {
        setAnimating(false);
        setYao([3, 3, 3]);
        setGua(Array(6));
    };
    const genYao = () => {
        setAnimating(true);
        setTimeout(() => {
            const yao_res = _.map(Array(3), coinFlip);
            setYao(yao_res);
            const new_gua = _.clone(gua);
            for (let i = new_gua.length - 1; i > -1; i--) {
                if (_.isUndefined(new_gua[i])) {
                    new_gua[i] = _.sum(yao_res);
                    break;
                }
            }
            setGua(new_gua);

            setAnimating(false);
        }, 2000);
    };

    return (
        <div className="GuaInput">
            <div className="guaGraph">
                {_.map(_.clone(gua), (yao, idx) => {
                    return _.isUndefined(yao) ? (
                        <div className="yao dashed" key={idx}>
                            <div className="space"></div>
                        </div>
                    ) : (
                        <div
                            className={yao % 2 ? 'yao yang' : 'yao yin'}
                            key={yao + '-' + idx}
                        ></div>
                    );
                })}
            </div>
            {hasCoins ? (
                <div className="inputBox">
                    {_.map(gua, (yao, idx) => {
                        return (
                            <Form.Item
                                labelCol={{ span: 4 }}
                                wrapperCol={{
                                    span: 20,
                                }}
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
                                    disabled={animating}
                                    value={yao}
                                    min={6}
                                    max={9}
                                    onChange={(val) => {
                                        if (val) {
                                            const new_gua = _.clone(gua);
                                            new_gua[idx] = val;
                                            setGua(new_gua);
                                        }
                                    }}
                                />
                            </Form.Item>
                        );
                    })}
                </div>
            ) : (
                <>
                    <div className="animationBox">
                        {_.map(Array(3), (_item, idx) => {
                            return (
                                <div
                                    key={idx}
                                    className={
                                        animating
                                            ? 'coinWrapper animating'
                                            : 'coinWrapper'
                                    }
                                >
                                    <div
                                        className="coinBox"
                                        style={{
                                            animationDelay: `${_.random(
                                                50,
                                                150,
                                            )}ms`,
                                        }}
                                    >
                                        {animating ? (
                                            <>
                                                <img
                                                    className="coin front"
                                                    src={front}
                                                    alt=""
                                                />
                                                <img
                                                    className="coin back"
                                                    src={back}
                                                    alt=""
                                                />
                                            </>
                                        ) : (
                                            <img
                                                className="coin "
                                                src={
                                                    yao[idx] % 2 ? front : back
                                                }
                                                alt=""
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="btnBox">
                        <Space>
                            <Button
                                disabled={
                                    animating ||
                                    !_.every(gua, (yao) => !_.isUndefined(yao))
                                }
                                onClick={reset}
                            >
                                重置
                            </Button>
                            <Button
                                type="primary"
                                disabled={
                                    animating ||
                                    _.every(gua, (yao) => !_.isUndefined(yao))
                                }
                                onClick={genYao}
                            >
                                抛硬币
                            </Button>
                        </Space>
                    </div>
                </>
            )}
        </div>
    );
};

export default GuaInput;
