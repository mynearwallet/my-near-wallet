function getResultMessageRegExp({ fromSymbol, fromAmount, toSymbol, toAmount }) {
    return new RegExp(`You swapped ${fromAmount} ${fromSymbol}[ ]{1,}to ${toAmount} ${toSymbol}`, 'im');
};

function removeStringBrakes(str) {
    return str.replace(/\r?\n|\r/g, ' ');
};

module.exports = {
    getResultMessageRegExp,
    removeStringBrakes,
};
