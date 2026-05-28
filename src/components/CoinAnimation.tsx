import front from '../assets/front.png';
import back from '../assets/back.png';
import { CoinValue } from '../types';

const ANIMATION_DELAYS = [60, 110, 150];

/** 展示三枚硬币的当前结果，并在抛硬币时播放翻转动画。 */
const CoinAnimation = (props: { animating: boolean; coins: CoinValue[] }) => {
    const { animating, coins } = props;

    return (
        <div className="animationBox">
            {coins.map((coin, idx) => {
                return (
                    <div
                        key={idx}
                        className={
                            animating ? 'coinWrapper animating' : 'coinWrapper'
                        }
                    >
                        <div
                            className="coinBox"
                            style={{
                                animationDelay: `${ANIMATION_DELAYS[idx]}ms`,
                            }}
                        >
                            {animating ? (
                                <>
                                    <img
                                        className="coin front"
                                        src={front}
                                        alt=""
                                    />
                                    <img
                                        className="coin back"
                                        src={back}
                                        alt=""
                                    />
                                </>
                            ) : (
                                <img
                                    className="coin"
                                    src={coin % 2 ? front : back}
                                    alt=""
                                />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CoinAnimation;
