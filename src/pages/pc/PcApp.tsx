import {
    Alert,
    Button,
    Col,
    Divider,
    Input,
    Row,
    Space,
    Tabs,
    Tooltip,
    Typography,
    message,
} from 'antd';
import { useEffect } from 'react';
import './app.less';
import '../../common.less';
import AiDetailReading from '../../components/AiDetailReading';
import CastingProgressHint from '../../components/CastingProgressHint';
import CoinAnimation from '../../components/CoinAnimation';
import GuaExplain from '../../components/GuaExplain';
import GuaGraph from '../../components/GuaGraph';
import GuaIntro from '../../components/GuaIntro';
import GuaManualInput from '../../components/GuaManualInput';
import GuaSessionMeta from '../../components/GuaSessionMeta';
import HistoryPanel from '../../components/HistoryPanel';
import UsageSummaryBar from '../../components/UsageSummaryBar';
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
        castingUsage,
        clearHistory,
        coins,
        createdAt,
        detailReadingUsage,
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
    const castingLimitReached = castingUsage?.allowed === false && !castingId;
    const startDisabledReason = castingLimitReached
        ? '今日起卦次数已用完，请明日再来'
        : undefined;

    return (
        <>
            <Row className="contentBox">
                <Col span={8} className="yaoBox">
                    <GuaIntro />
                    <UsageSummaryBar
                        castingUsage={castingUsage}
                        detailReadingUsage={detailReadingUsage}
                    />
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
                        {!isQuestionLocked && (
                            <Typography.Paragraph
                                className="startNotice"
                                type="secondary"
                            >
                                开始后将锁定所问之事，并消耗 1 次今日起卦次数。
                            </Typography.Paragraph>
                        )}
                        <Space>
                            <Button
                                disabled={animating || !baseReadingCompleted}
                                onClick={restart}
                            >
                                重新起卦
                            </Button>
                            <Tooltip title={startDisabledReason}>
                                <Button
                                    type="primary"
                                    disabled={
                                        animating ||
                                        initializing ||
                                        starting ||
                                        isComplete ||
                                        castingLimitReached
                                    }
                                    onClick={castCoins}
                                >
                                    抛硬币
                                </Button>
                            </Tooltip>
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
                    <CastingProgressHint
                        animating={animating}
                        coins={coins}
                        gua={gua}
                        nextYaoIndex={nextYaoIndex}
                    />
                    <GuaGraph gua={gua} activeIndex={nextYaoIndex} />
                    <Divider orientation="left"> 手动输入</Divider>
                    <GuaManualInput
                        activeIndex={nextYaoIndex}
                        disabled={
                            animating ||
                            initializing ||
                            starting ||
                            mode === 'online' ||
                            castingLimitReached
                        }
                        disabledReason={startDisabledReason}
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
                                                    usage={detailReadingUsage}
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
                                            disabledOpenReason={
                                                castingId ||
                                                (!baseReadingCompleted &&
                                                    !guaResult)
                                                    ? '当前起卦完成后才能打开历史记录'
                                                    : undefined
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
