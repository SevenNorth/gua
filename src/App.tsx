import { useState, useEffect } from 'react';
import {
    Col,
    Row,
    Button,
    Typography,
    Space,
    InputNumber,
    Form,
    Divider,
} from 'antd';
import './app.less';
import front from './assets/front.png';
import back from './assets/back.png';
import _ from 'lodash';
import { coinFlip } from './utils';
import { steps } from './utils/constant';
import { IGua } from './types';

const App = () => {
    const [animating, setAnimating] = useState(false);
    const [yao, setYao] = useState<number[]>([3, 3, 3]);
    const [gua, setGua] = useState<number[]>(Array(6));
    const [guaResult, setGuaResult] = useState<IGua>();

    const getExplain = async (gua: string) => {
        const url = `http://sevennorth.lovinghlx.cn/gua/${gua}.txt`;
        const restxt = await (await fetch(url)).text();
        const j1 = atob(restxt);
        const j2 = decodeURIComponent(j1);
        const guaRes = JSON.parse(j2);
        setGuaResult(guaRes);
    };

    useEffect(() => {
        if (_.every(gua, (yao) => !_.isUndefined(yao))) {
            const gua_str = _.reverse(_.map(gua, (y) => y % 2)).join('');
            getExplain(gua_str);
        }
    }, [gua]);

    const reset = () => {
        setAnimating(false);
        setYao([3, 3, 3]);
        setGua(Array(6));
        setGuaResult(undefined);
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
        <>
            <Row className="contentBox">
                <Col span={8} className="yaoBox">
                    <div className="headerBox">
                        <Typography.Title>相由心生 心诚则灵</Typography.Title>
                        <Typography.Title level={5}>
                            ————根据曾仕强先生的硬币卜卦法制作
                        </Typography.Title>
                        <Typography.Title level={4}>
                            算卦步骤:{' '}
                        </Typography.Title>
                        <Typography.Paragraph>
                            <ol>
                                {_.map(steps, (step, idx) => (
                                    <li key={idx}>{step}</li>
                                ))}
                            </ol>
                        </Typography.Paragraph>
                    </div>
                    <div className="animationBox">
                        {_.map(Array(3), (item, idx) => {
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
                </Col>
                <Col span={8} className="guaBox">
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
                    <Divider orientation="left"> 手动输入</Divider>
                    <div className="inputBox">
                        {_.map(gua, (yao, idx) => {
                            return (
                                <Form.Item
                                    labelCol={{ span: 4 }}
                                    wrapperCol={{
                                        span: 16,
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
                </Col>
                <Col span={8} className="explainBox">
                    <Divider orientation="left">解卦</Divider>
                    {guaResult ? (
                        <>
                            <Typography.Title level={5}>
                                {guaResult.name}
                            </Typography.Title>
                            <Typography.Paragraph>
                                <Typography.Text>
                                    {guaResult.info}
                                </Typography.Text>
                            </Typography.Paragraph>
                            <Typography.Paragraph>
                                <Typography.Text>
                                    {guaResult.intro}
                                </Typography.Text>
                            </Typography.Paragraph>
                            <Typography.Paragraph>
                                <ul>
                                    {_.map(guaResult.explain, (pl) => {
                                        return <li>{pl}</li>;
                                    })}
                                </ul>
                            </Typography.Paragraph>
                            <Typography.Paragraph>
                                <Typography.Text>
                                    台湾张铭仁解卦：
                                </Typography.Text>
                            </Typography.Paragraph>
                            <Typography.Paragraph>
                                <Typography.Text>
                                    {guaResult.external[0]}
                                </Typography.Text>
                            </Typography.Paragraph>
                            <Typography.Paragraph>
                                <Typography.Text>
                                    {guaResult.external[1]}
                                </Typography.Text>
                            </Typography.Paragraph>
                            <Typography.Paragraph>
                                <ul>
                                    {_.map(
                                        guaResult.external.slice(2),
                                        (pl) => {
                                            return <li>{pl}</li>;
                                        },
                                    )}
                                </ul>
                            </Typography.Paragraph>
                        </>
                    ) : null}
                </Col>
            </Row>
        </>
    );
};

export default App;
