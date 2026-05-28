import { useEffect } from 'react';
import { Button, Space } from 'antd';
import CoinAnimation from '../../../components/CoinAnimation';
import GuaGraph from '../../../components/GuaGraph';
import GuaManualInput from '../../../components/GuaManualInput';
import { useGuaCasting } from '../../../hooks/useGuaCasting';
import { ISTEP } from '../constants';

const GuaInput = (props: {
    hasCoins: boolean;
    setStep: React.Dispatch<React.SetStateAction<ISTEP>>;
    handleGuaRes: (s: string) => void;
}) => {
    const { hasCoins, setStep, handleGuaRes } = props;

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

    useEffect(() => {
        if (guaCode) {
            setStep(ISTEP.RESULT);
            handleGuaRes(guaCode);
        }
    }, [guaCode, handleGuaRes, setStep]);

    return (
        <div className="GuaInput">
            <GuaGraph gua={gua} />
            {hasCoins ? (
                <GuaManualInput
                    disabled={animating}
                    gua={gua}
                    labelColSpan={4}
                    onChange={setYaoAt}
                    wrapperColSpan={20}
                />
            ) : (
                <>
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
                </>
            )}
        </div>
    );
};

export default GuaInput;
