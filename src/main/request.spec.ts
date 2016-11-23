import {expect} from 'chai';
import {request} from "./request";

const http = require('http');

describe('request', function () {

    const TEST_PORT = 7777;
    let server;

    before(function() {
        server = http.createServer(function (req, res) {
            if (req.url == "/success") {
                res.end("success");
            } else {
                res.writeHead("500", "testing error", {'content-type' : 'text/plain'});
                res.end("error");
            }
        });
        server.listen(TEST_PORT);

    });

    after(function () {
        server.close();
    });

    it('request handling positive response', function (done) {
        let result = request("http://localhost:" + TEST_PORT+"/success");
        expect(result).not.to.be.null;
        result.then(function(data) {
            expect(data).to.equal("success");
            done();
        }, function() {
            expect.fail();
            done();
        });
    });

    it('request handling error response', function (done) {
        let result = request("http://localhost:" + TEST_PORT+"/error");
        expect(result).not.to.be.null;
        result.then(function() {
            expect.fail();
            done();
        }, function(error) {
            expect(error.code).to.equal(500);
            expect(error.message).to.equal('Failed to get data from "http://localhost:7777/error", status code 500');
            done();
        });
    });

});
