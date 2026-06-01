/** 随机模拟单枚硬币，返回背面 2 或正面 3。 */
const coinFlip = () => {
    return Math.floor(Math.random() * 2) === 0 ? 2 : 3;
};

/** 根据浏览器 UA 粗略判断是否使用移动端页面。 */
const isMobile = () => {
    if (window.matchMedia('(max-width: 768px)').matches) {
        return true;
    }

    const ua = navigator.userAgent;
    // 通过ua判断是不是移动端
    const mobileKeywords = [
        'Mobile',
        'Android',
        'iPhone',
        'iPad',
        'Windows Phone',
    ];
    return mobileKeywords.some((keyword) => ua.includes(keyword));
};

export { coinFlip, isMobile };
