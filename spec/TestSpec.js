describe("Test having two specs", () => {
    var Calculator = require('../TestExamples/Calculator');
    var SpiraReporter = require('../src/SpiraReporter');

    jasmine.getEnv().addReporter(new SpiraReporter({
        "url": "https://demo.spiraservice.net/peter-inflectra",
        "username": "fredbloggs",
        "token": "{7A05FD06-83C3-4436-B37F-51BCF0060483}",
        "projectId": 1,
        "releaseId": 1,
        "testSetId": 1,
        "testCases": {
            "default": 20
        }
}));

    describe("Test Equality", () => {
        it("Equality should be preserved", () => {
            expect(2).toEqual(2);
        })
    })

})
