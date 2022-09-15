function getResultMessageRegExp({ fromSymbol, fromAmount, toSymbol, toAmount }) {
    return new RegExp(`You swapped ${fromAmount} ${fromSymbol}[ ]{1,}to ${toAmount} ${toSymbol}`, 'im');
};

module.exports = {
    getResultMessageRegExp,
};
