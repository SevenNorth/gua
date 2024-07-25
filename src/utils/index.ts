const coinFlip = () => {
    return Math.floor(Math.random() * 2) == 0 ? 2 : 3;
};

export { coinFlip };
