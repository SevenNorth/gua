import { useEffect, useMemo, useState } from 'react';
import '../../common.less';
import './style.less';
import InitMsg from './steps/InitMsg';
import { Button, Divider, Drawer, Input, Space } from 'antd';
import GuaInput from './steps/GuaInput';
import GuaResult from './steps/GuaResult';
import { ISTEP } from './constants';
import HistoryPanel from '../../components/HistoryPanel';
import { useCastingSession } from '../../hooks/useCastingSession';
import { CastingMode } from '../../types';

const MobileApp = () => {
    const {
        animating,
        baseReadingCompleted,
        castCoins,
        clearHistory,
        coins,
        createdAt,
        gua,
        guaCode,
        historyRecords,
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
        castCoins,
        coins,
        createdAt,
        gua,
        guaCode,
        hasCoins,
        isComplete,
        isQuestionLocked,
        markBaseReadingCompleted,
        mobileStep,
        nextYaoIndex,
        question,
        restart,
        setQuestion,
        setYaoAt,
    ]);

    return (
        <div className="Mobile_App_Box">
            {content}
            {mobileStep === ISTEP.INIT && (
                <div className="btnBox">
                    <Divider orientation="center">选择模式</Divider>

                    <Space>
                        <Button
                            onClick={() => {
                                handleStart('online');
                            }}
                        >
                            没有硬币！在线抛
                        </Button>
                        <Button
                            type="primary"
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
                    records={historyRecords}
                    onClear={clearHistory}
                    onOpen={openHistoryRecord}
                />
            </Drawer>
        </div>
    );
};
export default MobileApp;
