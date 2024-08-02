import { Divider, Typography } from 'antd';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { IGua } from '../../../types';
const GuaResult = (props: { guaStr: string | undefined }) => {
    const { guaStr } = props;
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
        if (guaStr) {
            getExplain(guaStr);
        }
    }, [guaStr]);

    return (
        <div className="explainBox">
            <div className="guaGraph">
                {guaStr &&
                    _.map(guaStr.split('').reverse(), (yaostr, idx) => {
                        const yao = Number(yaostr);
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
            <Divider orientation="left">解卦</Divider>
            {guaResult ? (
                <>
                    <Typography.Title level={5}>
                        {guaResult.name}
                    </Typography.Title>
                    <Typography.Paragraph>
                        <Typography.Text>{guaResult.info}</Typography.Text>
                    </Typography.Paragraph>
                    <Typography.Paragraph>
                        <Typography.Text>{guaResult.intro}</Typography.Text>
                    </Typography.Paragraph>
                    <Typography.Paragraph>
                        <ul>
                            {_.map(guaResult.explain, (pl) => {
                                return <li>{pl}</li>;
                            })}
                        </ul>
                    </Typography.Paragraph>
                    <Typography.Paragraph>
                        <Typography.Text>台湾张铭仁解卦：</Typography.Text>
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
                            {_.map(guaResult.external.slice(2), (pl) => {
                                return <li>{pl}</li>;
                            })}
                        </ul>
                    </Typography.Paragraph>
                </>
            ) : null}
        </div>
    );
};

export default GuaResult;
