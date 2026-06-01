import { useEffect, useMemo, useState } from 'react';
import '../../common.less';
import './style.less';
import InitMsg from './steps/InitMsg';
import {
    Alert,
    Button,
    Divider,
    Drawer,
    Input,
    Space,
    Steps,
    Tooltip,
    Typography,
} from 'antd';
import GuaInput from './steps/GuaInput';
import GuaResult from './steps/GuaResult';
import { ISTEP } from './constants';
import HistoryPanel from '../../components/HistoryPanel';
import UsageSummaryBar from '../../components/UsageSummaryBar';
import { useCastingSession } from '../../hooks/useCastingSession';
import { CastingMode } from '../../types';

const MobileApp = () => {
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
        startCasting,
        starting,
        step,
    } = useCastingSession();
    const [historyOpen, setHistoryOpen] = useState(false);

    const mobileStep = useMemo(() => {
        if (step === 'result') {
            return ISTEP.RESULT;
        }

        if (step === 'input') {
            return ISTEP.INPUT;
        }

        return ISTEP.INIT;
    }, [step]);
    const mobileStepIndex = useMemo(() => {
        if (mobileStep === ISTEP.RESULT) {
            return 2;
        }

        if (mobileStep === ISTEP.INPUT) {
            return 1;
        }

        return 0;
    }, [mobileStep]);

    const hasCoins = mode === 'manual';
    const castingLimitReached = castingUsage?.allowed === false && !castingId;
    const startDisabledReason = castingLimitReached
        ? '今日起卦次数已用完，请明日再来'
        : undefined;

    const handleStart = (nextMode: CastingMode) => {
        startCasting(nextMode);
    };

    useEffect(() => {
        if (historyOpen && step === 'result') {
            setHistoryOpen(false);
        }
    }, [historyOpen, step]);

    const content = useMemo(() => {
        let c = null;
        switch (mobileStep) {
            case ISTEP.INIT:
                c = (
                    <InitMsg>
                        <div className="questionBox">
                            <Divider orientation="left">所问之事</Divider>
                            <Input.TextArea
                                autoSize={{ minRows: 3, maxRows: 5 }}
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
                    </InitMsg>
                );
                break;
            case ISTEP.INPUT:
                c = (
                    <GuaInput
                        animating={animating}
                        castCoins={castCoins}
                        coins={coins}
                        disabled={
                            initializing || starting || castingLimitReached
                        }
                        disabledReason={startDisabledReason}
                        gua={gua}
                        hasCoins={hasCoins}
                        isComplete={isComplete}
                        nextYaoIndex={nextYaoIndex}
                        setYaoAt={setYaoAt}
                    />
                );
                break;
            case ISTEP.RESULT:
                c = (
                    <GuaResult
                        baseReadingCompleted={baseReadingCompleted}
                        baseReadingResult={baseReadingResult}
                        castingId={castingId}
                        createdAt={createdAt}
                        gua={gua}
                        guaCode={guaCode}
                        markBaseReadingCompleted={markBaseReadingCompleted}
                        question={question}
                        restart={restart}
                        detailReadingUsage={detailReadingUsage}
                    />
                );
                break;
            default:
                break;
        }
        return c;
    }, [
        animating,
        baseReadingCompleted,
        baseReadingResult,
        castCoins,
        castingId,
        coins,
        createdAt,
        gua,
        guaCode,
        hasCoins,
        isComplete,
        initializing,
        isQuestionLocked,
        markBaseReadingCompleted,
        mobileStep,
        nextYaoIndex,
        question,
        restart,
        setQuestion,
        setYaoAt,
        starting,
        castingLimitReached,
        startDisabledReason,
        detailReadingUsage,
    ]);

    return (
        <div className="Mobile_App_Box">
            <Steps
                className="mobileSteps"
                current={mobileStepIndex}
                items={[
                    { title: '提问' },
                    { title: '起卦' },
                    { title: '解卦' },
                ]}
                size="small"
            />
            <UsageSummaryBar
                castingUsage={castingUsage}
                detailReadingUsage={detailReadingUsage}
            />
            {content}
            {apiError && (
                <Alert
                    className="apiAlert"
                    message={apiError}
                    showIcon
                    type="error"
                />
            )}
            {mobileStep === ISTEP.INIT && (
                <div className="btnBox">
                    <Divider orientation="center">选择模式</Divider>
                    {!isQuestionLocked && (
                        <Typography.Paragraph
                            className="startNotice"
                            type="secondary"
                        >
                            开始后将锁定所问之事，并消耗 1 次今日起卦次数。
                        </Typography.Paragraph>
                    )}

                    <Space>
                        <Tooltip title={startDisabledReason}>
                            <Button
                                disabled={
                                    initializing ||
                                    starting ||
                                    castingLimitReached
                                }
                                onClick={() => {
                                    handleStart('online');
                                }}
                            >
                                没有硬币！在线抛
                            </Button>
                        </Tooltip>
                        <Tooltip title={startDisabledReason}>
                            <Button
                                type="primary"
                                disabled={
                                    initializing ||
                                    starting ||
                                    castingLimitReached
                                }
                                onClick={() => {
                                    handleStart('manual');
                                }}
                            >
                                我有硬币！真的抛
                            </Button>
                        </Tooltip>
                    </Space>
                    <div className="historyEntry">
                        <Button onClick={() => setHistoryOpen(true)}>
                            历史记录
                        </Button>
                    </div>
                </div>
            )}
            <Drawer
                title="历史记录"
                open={historyOpen}
                placement="bottom"
                height="70%"
                onClose={() => setHistoryOpen(false)}
            >
                <HistoryPanel
                    disableOpen={!!castingId}
                    disabledOpenReason={
                        castingId
                            ? '当前起卦完成后才能打开历史记录'
                            : undefined
                    }
                    records={historyRecords}
                    onClear={clearHistory}
                    onOpen={openHistoryRecord}
                />
            </Drawer>
        </div>
    );
};
export default MobileApp;
