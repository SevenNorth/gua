import { useMemo, useState } from 'react';
import '../../common.less';
import './style.less';
import InitMsg from './steps/InitMsg';
import { Button, Divider, Space } from 'antd';
import GuaInput from './steps/GuaInput';
import GuaResult from './steps/GuaResult';

export enum ISTEP {
    INIT = 'INIT',
    INPUT = 'INPUT',
    RESULT = 'RESULT',
}

const MobileApp = () => {
    const [step, setStep] = useState(ISTEP.INIT);
    const [hasCoins, setHasCoins] = useState<boolean>(false);
    const [guaStr, setGuaStr] = useState<string>();

    const content = useMemo(() => {
        let c = null;
        switch (step) {
            case ISTEP.INIT:
                c = <InitMsg />;
                break;
            case ISTEP.INPUT:
                c = (
                    <GuaInput
                        hasCoins={hasCoins}
                        setStep={setStep}
                        handleGuaRes={(str: string) => setGuaStr(str)}
                    />
                );
                break;
            case ISTEP.RESULT:
                c = <GuaResult guaStr={guaStr} />;
                break;
            default:
                break;
        }
        return c;
    }, [step, hasCoins, guaStr]);

    return (
        <div className="Mobile_App_Box">
            {content}
            {step === ISTEP.INIT && (
                <div className="btnBox">
                    <Divider orientation="center">选择模式</Divider>

                    <Space>
                        <Button
                            onClick={() => {
                                setStep(ISTEP.INPUT);
                                setHasCoins(false);
                            }}
                        >
                            没有硬币！在线抛
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => {
                                setStep(ISTEP.INPUT);
                                setHasCoins(true);
                            }}
                        >
                            我有硬币！真的抛
                        </Button>
                    </Space>
                </div>
            )}
            {step === ISTEP.RESULT && (
                <div className="btnBox">
                    <Space>
                        <Button
                            onClick={() => {
                                setStep(ISTEP.INPUT);
                            }}
                        >
                            再来一次
                        </Button>
                    </Space>
                </div>
            )}
        </div>
    );
};
export default MobileApp;
