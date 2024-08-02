const coinFlip = () => {
    return Math.floor(Math.random() * 2) == 0 ? 2 : 3;
};

const isMobile = () => {
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
