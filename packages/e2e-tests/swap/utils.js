// this constant is taken from the swap page of /frontend directory
// we need to remember to keep it in sync
const VISIBLE_DECIMALS = 7;

const cutDecimalsIfPossible = (amount, decimals) => {
    const strAmount = String(amount);
    const decimalPointIndex = strAmount.indexOf('.');
    const firstDecimalIndex = decimalPointIndex <= 0 ? -1 : decimalPointIndex + 1;

    return firstDecimalIndex
        ? `${strAmount.slice(0, decimalPointIndex)}.${strAmount.slice(
            firstDecimalIndex,
            firstDecimalIndex + decimals
        )}`
        : strAmount;
};

function getResultMessageRegExp({
    fromSymbol,
    fromAmount,
    toSymbol,
    toAmount,
    acceptableOutputDifference = 0,
}) {
    const expectedFromAmount = cutDecimalsIfPossible(fromAmount, VISIBLE_DECIMALS);
    const expectedToAmount = cutDecimalsIfPossible(
      toAmount,
      VISIBLE_DECIMALS - acceptableOutputDifference
    );

    return new RegExp(
        `You swapped ${expectedFromAmount} ${fromSymbol}[ ]{1,}to ${expectedToAmount}\\d* ${toSymbol}`,
        'im'
    );
};

function removeStringBrakes(str) {
    return str.replace(/\r?\n|\r/g, ' ');
};

module.exports = {
    getResultMessageRegExp,
    removeStringBrakes,
};
