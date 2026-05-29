import {
    Alert,
    Button,
    Col,
    Divider,
    Input,
    Row,
    Space,
    Tabs,
    message,
} from 'antd';
import { useEffect } from 'react';
import './app.less';
import '../../common.less';
import AiDetailReading from '../../components/AiDetailReading';
import CoinAnimation from '../../components/CoinAnimation';
import GuaExplain from '../../components/GuaExplain';
import GuaGraph from '../../components/GuaGraph';
import GuaIntro from '../../components/GuaIntro';
import GuaManualInput from '../../components/GuaManualInput';
import GuaSessionMeta from '../../components/GuaSessionMeta';
import HistoryPanel from '../../components/HistoryPanel';
import { useCastingSession } from '../../hooks/useCastingSession';
import { useGuaExplain } from '../../hooks/useGuaExplain';
import { buildGuaShareText, copyText } from '../../utils/share';

const PcApp = () => {
    const {
        animating,
        apiError,
        baseReadingCompleted,
        baseReadingResult,
        castCoins,
        castingId,
        clearHistory,
        coins,
        createdAt,
        gua,
        guaCode,
        historyRecords,
        initializing,
        isComplete,
        isQuestionLocked,
        markBaseReadingCompleted,
        mode,
        nextYaoIndex,
        openHistoryRecord,
        question,
        restart,
        setQuestion,
        setYaoAt,
        starting,
    } = useCastingSession();
    const { error, guaResult, loading } = useGuaExplain(
        guaCode,
        baseReadingResult,
    );

    useEffect(() => {
        if (guaResult && !baseReadingCompleted) {
            markBaseReadingCompleted(guaResult);
        }
    }, [baseReadingCompleted, guaResult, markBaseReadingCompleted]);

    const handleCopy = async () => {
        try {
            await copyText(
                buildGuaShareText({
                    question,
                    createdAt,
                    lines: gua,
                    guaCode,
                    guaResult,
                }),
            );
            message.success('已复制起卦结果');
        } catch {
            message.error('复制失败，请稍后重试');
        }
    };

    return (
        <>
            <Row className="contentBox">
                <Col span={8} className="yaoBox">
                    <GuaIntro />
                    {apiError && (
                        <Alert
                            className="apiAlert"
                            message={apiError}
                            showIcon
                            type="error"
                        />
                    )}
                    <CoinAnimation animating={animating} coins={coins} />
                    <div className="btnBox">
                        <Space>
                            <Button
                                disabled={animating || !baseReadingCompleted}
                                onClick={restart}
                            >
                                重新起卦
                            </Button>
                            <Button
                                type="primary"
                                disabled={
                                    animating ||
                                    initializing ||
                                    starting ||
                                    isComplete
                                }
                                onClick={castCoins}
                            >
                                抛硬币
                            </Button>
                        </Space>
                    </div>
                </Col>
                <Col span={8} className="guaBox">
                    <div className="questionBox">
                        <Divider orientation="left">所问之事</Divider>
                        <Input.TextArea
                            autoSize={{ minRows: 3, maxRows: 4 }}
                            disabled={isQuestionLocked}
                            maxLength={100}
                            placeholder="可留空。开始起卦后将锁定。"
                            showCount
                            value={question}
                            onChange={(event) =>
                                setQuestion(event.target.value)
                            }
                        />
                    </div>
                    <GuaGraph gua={gua} activeIndex={nextYaoIndex} />
                    <Divider orientation="left"> 手动输入</Divider>
                    <GuaManualInput
                        activeIndex={nextYaoIndex}
                        disabled={
                            animating ||
                            initializing ||
                            starting ||
                            mode === 'online'
                        }
                        gua={gua}
                        labelColSpan={4}
                        onChange={setYaoAt}
                        wrapperColSpan={16}
                    />
                </Col>
                <Col span={8} className="explainBox">
                    <Tabs
                        className="resultTabs"
                        items={[
                            {
                                key: 'result',
                                label: '解卦',
                                children: (
                                    <div className="resultTabPane">
                                        <GuaSessionMeta
                                            createdAt={createdAt}
                                            question={question}
                                        />
                                        <div className="readingScrollArea">
                                            <GuaExplain
                                                error={error}
                                                guaResult={guaResult}
                                                loading={loading}
                                            />
                                        </div>
                                        {guaResult && (
                                            <Space className="resultActions">
                                                <AiDetailReading
                                                    castingId={castingId}
                                                    gua={gua}
                                                    guaCode={guaCode}
                                                    question={question}
                                                />
                                                <Button onClick={handleCopy}>
                                                    复制结果
                                                </Button>
                                                <Button onClick={restart}>
                                                    重新起卦
                                                </Button>
                                            </Space>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: 'history',
                                label: '历史',
                                children: (
                                    <div className="historyTabPane">
                                        <HistoryPanel
                                            disableOpen={
                                                !!castingId ||
                                                (!baseReadingCompleted &&
                                                    !guaResult)
                                            }
                                            records={historyRecords}
                                            onClear={clearHistory}
                                            onOpen={openHistoryRecord}
                                        />
                                    </div>
                                ),
                            },
                        ]}
                    />
                </Col>
            </Row>
        </>
    );
};

export default PcApp;
