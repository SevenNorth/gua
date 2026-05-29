import { useEffect, useState } from 'react';
import { getGuaExplain } from '../services/gua';
import { IGua } from '../types';

/** 按卦码加载解卦结果，并暴露加载状态与错误信息。 */
const useGuaExplain = (guaCode: string | undefined, initialResult?: IGua) => {
    const [guaResult, setGuaResult] = useState<IGua | undefined>(initialResult);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    useEffect(() => {
        let ignoreResult = false;

        setError(undefined);

        if (initialResult) {
            setGuaResult(initialResult);
            setLoading(false);
            return () => {
                ignoreResult = true;
            };
        }

        if (!guaCode) {
            setGuaResult(undefined);
            setLoading(false);
            return () => {
                ignoreResult = true;
            };
        }

        setLoading(true);
        setGuaResult(undefined);

        getGuaExplain(guaCode)
            .then((result) => {
                if (!ignoreResult) {
                    setGuaResult(result);
                }
            })
            .catch((err: unknown) => {
                if (!ignoreResult) {
                    setError(err instanceof Error ? err.message : '解卦数据加载失败');
                }
            })
            .finally(() => {
                if (!ignoreResult) {
                    setLoading(false);
                }
            });

        return () => {
            ignoreResult = true;
        };
    }, [guaCode, initialResult]);

    return { error, guaResult, loading };
};

export { useGuaExplain };
