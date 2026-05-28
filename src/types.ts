/** 解卦数据文件解码后的结构。 */
export interface IGua {
    gua: string;
    name: string;
    info: string;
    intro: string;
    explain: string[];
    external: string[];
}

/** 单枚硬币结果：背面为 2，正面为 3。 */
export type CoinValue = 2 | 3;

/** 三枚硬币相加后得到的一爻结果。 */
export type YaoValue = 6 | 7 | 8 | 9;

/** 页面按从上到下的显示顺序存放六爻，未完成的爻为 undefined。 */
export type GuaLines = Array<YaoValue | undefined>;
