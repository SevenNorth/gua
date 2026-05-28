import { IGua } from '../types';

const isStringArray = (value: unknown): value is string[] => {
    return (
        Array.isArray(value) &&
        value.every((item) => typeof item === 'string')
    );
};

/** 校验解码后的 JSON 是否符合解卦数据结构。 */
const isGuaResult = (value: unknown): value is IGua => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const guaResult = value as Partial<IGua>;

    return (
        typeof guaResult.gua === 'string' &&
        typeof guaResult.name === 'string' &&
        typeof guaResult.info === 'string' &&
        typeof guaResult.intro === 'string' &&
        isStringArray(guaResult.explain) &&
        isStringArray(guaResult.external)
    );
};

/**
 * 根据 6 位卦码加载并解析解卦数据。
 * 数据文件内容经过 base64 与 URI 编码，读取后需要依次解码再解析 JSON。
 */
const getGuaExplain = async (guaCode: string): Promise<IGua> => {
    const response = await fetch(`/gua/${guaCode}.txt`);

    if (!response.ok) {
        throw new Error('解卦数据加载失败');
    }

    const encodedText = await response.text();

    try {
        const decodedText = decodeURIComponent(atob(encodedText));
        const parsedData: unknown = JSON.parse(decodedText);

        if (!isGuaResult(parsedData)) {
            throw new Error('Invalid gua data');
        }

        return parsedData;
    } catch {
        throw new Error('解卦数据解析失败');
    }
};

export { getGuaExplain };
