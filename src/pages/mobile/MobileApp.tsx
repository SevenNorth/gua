import { useEffect, useMemo, useState } from 'react';
import '../../common.less';
import './style.less';
import InitMsg from './steps/InitMsg';
import { Alert, Button, Divider, Drawer, Input, Space } from 'antd';
import GuaInput from './steps/GuaInput';
import GuaResult from './steps/GuaResult';
import { ISTEP } from './constants';
import HistoryPanel from '../../components/HistoryPanel';
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

    const hasCoins = mode === 'manual';

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
                            initializing ||
                            starting
                        }
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
    ]);

    return (
        <div className="Mobile_App_Box">
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

                    <Space>
                        <Button
                            disabled={
                                initializing || starting
                            }
                            onClick={() => {
                                handleStart('online');
                            }}
                        >
                            没有硬币！在线抛
                        </Button>
                        <Button
                            type="primary"
                            disabled={
                                initializing || starting
                            }
                            onClick={() => {
                                handleStart('manual');
                            }}
                        >
                            我有硬币！真的抛
                        </Button>
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
                    records={historyRecords}
                    onClear={clearHistory}
                    onOpen={openHistoryRecord}
                />
            </Drawer>
        </div>
    );
};
export default MobileApp;
