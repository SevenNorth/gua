import { Col, Row, Button, Space, Divider } from 'antd';
import './app.less';
import '../../common.less';
import CoinAnimation from '../../components/CoinAnimation';
import GuaExplain from '../../components/GuaExplain';
import GuaGraph from '../../components/GuaGraph';
import GuaIntro from '../../components/GuaIntro';
import GuaManualInput from '../../components/GuaManualInput';
import { useGuaCasting } from '../../hooks/useGuaCasting';
import { useGuaExplain } from '../../hooks/useGuaExplain';

const PcApp = () => {
    const {
        animating,
        castCoins,
        coins,
        gua,
        guaCode,
        hasYao,
        isComplete,
        reset,
        setYaoAt,
    } = useGuaCasting();
    const { error, guaResult, loading } = useGuaExplain(guaCode);

    return (
        <>
            <Row className="contentBox">
                <Col span={8} className="yaoBox">
                    <GuaIntro />
                    <CoinAnimation animating={animating} coins={coins} />
                    <div className="btnBox">
                        <Space>
                            <Button
                                disabled={animating || !hasYao}
                                onClick={reset}
                            >
                                重置
                            </Button>
                            <Button
                                type="primary"
                                disabled={animating || isComplete}
                                onClick={castCoins}
                            >
                                抛硬币
                            </Button>
                        </Space>
                    </div>
                </Col>
                <Col span={8} className="guaBox">
                    <GuaGraph gua={gua} />
                    <Divider orientation="left"> 手动输入</Divider>
                    <GuaManualInput
                        disabled={animating}
                        gua={gua}
                        labelColSpan={4}
                        onChange={setYaoAt}
                        wrapperColSpan={16}
                    />
                </Col>
                <Col span={8} className="explainBox">
                    <Divider orientation="left">解卦</Divider>
                    <GuaExplain
                        error={error}
                        guaResult={guaResult}
                        loading={loading}
                    />
                </Col>
            </Row>
        </>
    );
};

export default PcApp;
