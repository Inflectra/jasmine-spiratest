

describe("Test Calculator", () => {
    var Calculator = require('../TestExamples/Calculator');
    var SpiraReporter = require('../src/SpiraReporter');


    jasmine.getEnv().addReporter(new SpiraReporter({
        "url": "",
        "username": "fredbloggs",
        "token": "{}",
        "projectId": 1,
        "releaseId": 1,
        "testSetId": 1,
        "testCases": {
            "default": 20,
            "should multiply correctly": 21,
            "should solve exponents and logarithms correctly": 16
        }
    }));
    var calc;
    beforeEach(() => {
        calc = new Calculator();
    })

    //tests should succeed
    describe("Test the storage functionality of the calculator", () => {
        it("Should be able to overwrite the storage and retrieve the old value", () => {
            calc.storeValue(3);
            expect(calc.storedValue).toEqual(3);

            let result = calc.storeValue(5);
            expect(result).toEqual(3);
            expect(calc.storedValue).toEqual(5);
        })

    })

    describe("Test the arithmetic part of the calculator", () => {
        let val1 = 5, val2 = 3;
        it("Should add successfully", () => {
            let result = calc.add(val1, val2);
            //should succeed
            expect(result).toEqual(8);
        })

        it("Should multiply correctly", () => {
            let result = calc.multiply(val1, val2);
            //should throw an error, as result should be 15
            expect(result).toEqual(18);
        })
    })

    describe("Test the more complicated parts of the calculator", () => {
        it("Should solve exponents and logarithms correctly", () => {
            //should store 2 in result1
            let result1 = calc.ln(Math.E ** 2);
            //Allow for some margin of error because of the imprecision of floating point calculations
            expect(result1).toBeCloseTo(2, .01);
            //should be 1
            let result2 = calc.ln(Math.E);
            //should fail
            expect(result2).toBeCloseTo(0, .01);
            //should be 8
            let result3 = calc.exp(2, 3);
            //should fail
            expect(result3).toBeCloseTo(9, .01);
        })

    })
})
