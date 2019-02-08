module.exports = Calculator;


function Calculator() {

}

Calculator.prototype.storedValue = undefined;

Calculator.prototype.add = (val1, val2) => {
    return val1 + val2;
}

Calculator.prototype.storeValue = (toStore) => {
    oldValue = Calculator.prototype.storedValue;
    Calculator.prototype.storedValue = toStore;
    return oldValue;
}

Calculator.prototype.retrieveStoredValue = () => {
    return Calculator.prototype.storedValue;
}

Calculator.prototype.multiply = (val1, val2) => {
    return val1 * val2;
}

Calculator.prototype.ln = (val) => {
    return Math.log(val);
}

Calculator.prototype.exp = (val1, val2) => {
    return val1 ** val2;
}


