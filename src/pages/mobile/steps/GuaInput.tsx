import { Button, Space } from 'antd';
import CoinAnimation from '../../../components/CoinAnimation';
import GuaGraph from '../../../components/GuaGraph';
import GuaManualInput from '../../../components/GuaManualInput';
import { CoinValue, GuaLines } from '../../../types';

const GuaInput = (props: {
    hasCoins: boolean;
    animating: boolean;
    castCoins: () => void;
    coins: CoinValue[];
    gua: GuaLines;
    isComplete: boolean;
    nextYaoIndex?: number;
    setYaoAt: (index: number, value: number | null) => void;
}) => {
    const {
        animating,
        castCoins,
        coins,
        gua,
        isComplete,
        nextYaoIndex,
        setYaoAt,
        hasCoins,
    } = props;

    return (
        <div className="GuaInput">
            <GuaGraph gua={gua} activeIndex={nextYaoIndex} />
            {hasCoins ? (
                <GuaManualInput
                    activeIndex={nextYaoIndex}
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
