var http = require('http');
var https = require('https');
const spiraServiceUrl = "/Services/v5_0/RestService.svc/";

module.exports = SpiraReporter;

/**
 * Where all executed test runs are put before they are posted to Spira. Here is the format:
 * {
 * testCaseId: int,
 * testName: string
 * stackTrace: string
 * statusId: int
 * startDate: string
 * message: string
 * releaseId: int
 * testSetId: int 
 * }
 */
var allTestRuns = [];

/**
 * Credentials for accessing Spira
 */
var credentials = {};

/**
 * The last posted test run. Used to avoid POSTing duplicates
 */
var lastPosted = {};

/**
 * 
 * @param params Either a string containing an absolute directory to a json file containing 
 * Spira credentials, or an object in the same format as the file
 */
function SpiraReporter(params) {
    //make sure user has given all the essentials
    if (params.hasOwnProperty("url") && params.hasOwnProperty("username")
        && params.hasOwnProperty("token") && params.hasOwnProperty("projectId")) {
        credentials.url = params.url;
        credentials.username = params.username;
        credentials.token = params.token;
        credentials.projectId = params.projectId;
    }
    else {
        //'yell' at them
        console.error("-- SPIRA ERROR --");
        console.error("Please make sure you have the 'url', 'username'," +
            " 'token', and 'projectId' fields defined. This integration" +
            " will not work without them.");
    }
    //make sure the user has test cases taken care of
    if (params.hasOwnProperty("testCases")) {
        credentials.testCases = {};
        if (params.testCases.hasOwnProperty("default")) {
            credentials.testCases.default = params.testCases.default;
        }
        else {
            console.error("-- SPIRA ERROR --");
            console.error("Please Make sure you have the 'default'" +
                " field within the 'testCases' object. ");
        }
        //process unique test case names
        for (var property in params.testCases) {
            if (property != "default" && params.testCases.hasOwnProperty(property)) {
                //remove special characters and spaces and assign to the credentials
                credentials.testCases[compressName(property)] = params.testCases[property];
            }
        }

    }
    else {
        console.error("-- SPIRA ERROR --");
        console.error("Please make sure you have a field called 'testCases'");
    }

    //nonessential properties
    if (params.hasOwnProperty("releaseId")) {
        credentials.releaseId = params.releaseId;
    }
    if (params.hasOwnProperty("testSetId")) {
        credentials.testSetId = params.testSetId;
    }
}

/**
 * Remove the spaces, special characters, and punctuation from the given string.
 * Used for assigning test cases to individual specs (the it call)
 * @param {string} name 
 */
function compressName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/ig, "")
}

SpiraReporter.prototype.jasmineDone = async (suiteInfo, done) => {
    //actually send stuff up
    await postTestRuns();
    //done();
}

SpiraReporter.prototype.specDone = (result) => {
    //avoid storing duplicates
    if (result.id != lastPosted.id) {
        lastPosted = result;

        var newTestRun = {
            testCaseId: credentials.testCases.default,
            testName: result.description,
            stackTrace: '',
            statusId: -1,
            startDate: "",
            message: ""
        }

        //assign an individual test case
        for (var property in credentials.testCases) {
            if (property != "default" && credentials.testCases.hasOwnProperty(property)) {
                if (compressName(result.description) == property) {
                    newTestRun.testCaseId = credentials.testCases[property];
                }
            }
        }


        //populate the stack trace from all failed tests
        result.failedExpectations.forEach(e => {
            newTestRun.stackTrace += e.stack;
        });

        //populate the startDate
        newTestRun.startDate = "/Date(" + new Date().getTime() + "-0000)/";

        if (result.status == "passed") {
            //2 is passed in Spira
            newTestRun.statusId = 2;
            newTestRun.message = "Test Succeeded";
        }
        else if (result.status == "failed") {
            //1 is failed in Spira
            newTestRun.statusId = 1;
            newTestRun.message = "Test Failed";
        }

        //handle optional release and test set ID's
        if (credentials.hasOwnProperty("releaseId")) {
            newTestRun.releaseId = credentials.releaseId;
        }
        if (credentials.hasOwnProperty("testSetId")) {
            newTestRun.testSetId = credentials.testSetId;
        }




        allTestRuns.push(newTestRun);
    }
}

/**
 * Post all test runs in the allTestRuns array
 */
async function postTestRuns() {
    return new Promise(resolve => {
        //we will submit all test runs at once
        var url = credentials.url + spiraServiceUrl + "projects/" + credentials.projectId
            + "/test-runs/record?username=" + credentials.username
            + "&api-key=" + credentials.token;

        var protocol = http.request;
        if (url.startsWith("https")) {
            protocol = https.request;
            //cut the https:// out of the url
            url = url.substring(8);
        }
        else if (url.startsWith("http")) {
            //cut out the http:// out of the url
            url = url.substring(7);
        }

        var path = url.substring(url.indexOf("/"));
        url = url.substring(0, url.length - path.length);

        var options = {
            host: url,
            path: path,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "accept": "application/json"
            }
        }

        //used to tell how many POST requests were actually made
        var numRequestsMade = 0;

        //tabulate our data into something Spira can read and POST it
        allTestRuns.forEach(e => {
            var run = {
                //1 for plain text
                TestRunFormatId: 1,
                TestCaseId: e.testCaseId,
                RunnerTestName: e.testName,
                RunnerName: "JasmineJS",
                RunnerMessage: e.message,
                RunnerStackTrace: e.stackTrace,
                ExecutionStatusId: e.statusId,
                StartDate: e.startDate
            }

            //handle optional release and test set ID's
            if (e.hasOwnProperty("releaseId")) {
                run.ReleaseId = e.releaseId;
            }
            if (e.hasOwnProperty("testSetId")) {
                run.TestSetId = e.testSetId;
            }

            //open the POST request
            var request = protocol(options, (res) => {
                // console.log(res.statusCode + " : " + res.statusMessage);

                res.on('data', chunk => {
                    numRequestsMade++;
                    // console.log("RETURN: " + chunk)
                    if (numRequestsMade == allTestRuns.length) {
                        //empty array for next suite.
                        allTestRuns = [];
                        resolve();
                    }
                })
            });

            request.on("error", e => {
                console.log("Spira Error " + e);
            })

            //actually send the data
            request.write(JSON.stringify(run));
            request.end();

        });
    });
}

