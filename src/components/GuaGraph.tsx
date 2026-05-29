import { GuaLines } from '../types';
import { isYangYao } from '../utils/gua';

/** 绘制六爻卦象，输入顺序为页面展示顺序：上爻在前，初爻在后。 */
const GuaGraph = (props: { gua: GuaLines; activeIndex?: number }) => {
    const { activeIndex, gua } = props;

    return (
        <div className="guaGraph">
            {gua.map((yao, idx) => {
                const activeClassName = activeIndex === idx ? ' active' : '';

                if (yao === undefined) {
                    return (
                        <div className={`yao dashed${activeClassName}`} key={idx}>
                            <div className="space"></div>
                        </div>
                    );
                }

                return (
                    <div
                        className={`${
                            isYangYao(yao) ? 'yao yang' : 'yao yin'
                        }${activeClassName}`}
                        key={`${yao}-${idx}`}
                    ></div>
                );
            })}
        </div>
    );
};

export default GuaGraph;
