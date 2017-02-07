import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {WebSocketMock} from './WebSocketMock';
import {JobStatus, JobProgress, JobStatusEnum} from './Job';
import {WebAPIClient, newWebAPIClient} from './WebAPIClient';

const expect = chai.expect;
chai.should();
chai.use(chaiAsPromised);


describe('WebAPIClient', function () {

    let webSocket;
    let webAPI;

    beforeEach(function () {
        webSocket = new WebSocketMock();
        webAPI = newWebAPIClient('ws://test/me/now', 0, webSocket);
    });

    describe('WebAPIClient Promise returned by call()', function () {

        it('resolves on response: Promise.then()', function () {
            const job = webAPI.call('anyMethod', ['A', 2, true]);
            webSocket.emulateIncomingMessages(
                {
                    jsonrcp: "2.0",
                    id: 0,
                    response: 'ok',
                }
            );
            return expect(job).to.eventually.equal('ok');
        });


        it('is rejected on error: Promise.catch()', function () {
            const job = webAPI.call('anyMethod', ['A', 2, true]);
            webSocket.emulateIncomingMessages(
                {
                    jsonrcp: "2.0",
                    id: 0,
                    error: {
                        message: 'out of memory',
                        code: 512,
                    },
                }
            );
            return expect(job).to.be.rejectedWith({
                message: 'out of memory',
                code: 512,
            });
        });

        it('calls "onProgress" handler while running', function () {
            const progresses = [];
            const onProgress = (progress: JobProgress) => {
                progresses.push(progress);
            };
            const job = webAPI.call('anyMethod', ['A', 2, true], onProgress);
            webSocket.emulateIncomingMessages(
                {
                    jsonrcp: "2.0",
                    id: 0,
                    progress: {
                        worked: 30,
                        total: 100
                    },
                },
                {
                    jsonrcp: "2.0",
                    id: 0,
                    progress: {
                        message: 'warning: low memory',
                        worked: 60,
                        total: 100
                    },
                },
                {
                    jsonrcp: "2.0",
                    id: 0,
                    response: 'that was hard!',
                }
            );
            expect(progresses).to.deep.equal([
                {
                    id: 0,
                    worked: 30,
                    total: 100
                },
                {
                    id: 0,
                    message: 'warning: low memory',
                    worked: 60,
                    total: 100
                }
            ]);
            return expect(job).to.eventually.equal('that was hard!');
        });

    });

    describe('WebAPIClient job status changes', function () {

        it('changes status to done', function () {
            const job = webAPI.call('anyMethod', ['A', 2, true]).getJob();
            expect(job.getStatus()).to.equal(JobStatusEnum.SUBMITTED);
            webSocket.emulateIncomingMessages(
                {
                    jsonrcp: "2.0",
                    id: 0,
                    response: 'ok',
                }
            );
            expect(job.getStatus()).to.equal(JobStatusEnum.DONE);
        });

        it('changes status to failed', function () {
            let promise = webAPI.call('anyMethod', ['A', 2, true]);
            // Note: we must have a promise rejection handler, otherwise we get a node warning:
            // UnhandledPromiseRejectionWarning: Unhandled promise rejection
            promise.catch(() => {
            });
            const job = promise.getJob();
            expect(job.getStatus()).to.equal(JobStatusEnum.SUBMITTED);
            webSocket.emulateIncomingMessages(
                {
                    jsonrcp: "2.0",
                    id: 0,
                    error: {
                        message: 'out of memory',
                        code: 512,
                    },
                }
            );
            expect(job.getStatus()).to.equal(JobStatusEnum.FAILED);
        });

        it('changes status to cancelled', function () {
            let promise = webAPI.call('anyMethod', ['A', 2, true]);
            // Note: we must have a promise rejection handler, otherwise we get a node warning:
            // UnhandledPromiseRejectionWarning: Unhandled promise rejection
            promise.catch(() => {
            });
            const job = promise.getJob();
            expect(job.getStatus()).to.equal(JobStatusEnum.SUBMITTED);
            webSocket.emulateIncomingMessages(
                {
                    jsonrcp: "2.0",
                    id: 0,
                    error: {
                        message: 'cancelled',
                        code: 999,
                    },
                }
            );
            expect(job.getStatus()).to.equal(JobStatusEnum.CANCELLED);
        });

        it('changes status while progressing and then to done', function () {
            const job = webAPI.call('anyMethod', ['A', 2, true]).getJob();
            expect(job.getStatus()).to.equal(JobStatusEnum.SUBMITTED);

            webSocket.emulateIncomingMessages(
                {
                    jsonrcp: "2.0",
                    id: 0,
                    progress: {
                        worked: 30,
                        total: 100
                    },
                }
            );
            expect(job.getStatus()).to.equal(JobStatusEnum.IN_PROGRESS);

            webSocket.emulateIncomingMessages(
                {
                    jsonrcp: "2.0",
                    id: 0,
                    progress: {
                        message: 'warning: low memory',
                        worked: 60,
                        total: 100
                    },
                }
            );
            expect(job.getStatus()).to.equal(JobStatusEnum.IN_PROGRESS);

            webSocket.emulateIncomingMessages(
                {
                    jsonrcp: "2.0",
                    id: 0,
                    response: 'ok',
                }
            );
            expect(job.getStatus()).to.equal(JobStatusEnum.DONE);
        });
    });

    describe('WebAPIClient handler notification', function () {

        it('notifies open/error/close handlers', function () {
            let actualOpenEvent;
            let actualErrorEvent;
            let actualCloseEvent;

            webAPI.onOpen = (event) => {
                actualOpenEvent = event;
            };

            webAPI.onError = (event) => {
                actualErrorEvent = event;
            };

            webAPI.onClose = (event) => {
                actualCloseEvent = event;
            };

            webSocket.emulateOpen({message: 'open'});
            expect(actualOpenEvent).to.deep.equal({message: 'open'});
            expect(actualErrorEvent).to.be.undefined;
            expect(actualCloseEvent).to.be.undefined;

            webSocket.emulateError({message: 'error'});
            expect(actualOpenEvent).to.deep.equal({message: 'open'});
            expect(actualErrorEvent).to.deep.equal({message: 'error'});
            expect(actualCloseEvent).to.be.undefined;

            webSocket.emulateClose({message: 'close'});
            expect(actualOpenEvent).to.deep.equal({message: 'open'});
            expect(actualErrorEvent).to.deep.equal({message: 'error'});
            expect(actualCloseEvent).to.deep.equal({message: 'close'});
        });

        it('notifies warning handlers', function () {
            let actualWarningEvent;

            webAPI.onWarning = (event) => {
                actualWarningEvent = event;
            };

            webSocket.emulateIncomingRawMessages('this is no valid JSON');
            expect(actualWarningEvent).to.deep.equal({
                type: 'warning',
                message: 'Received invalid JSON-RCP message from WebAPI. Message is no valid JSON. Ignoring it.\n' +
                '--------------------\n' +
                'this is no valid JSON\n' +
                '--------------------',
            });

            webSocket.emulateIncomingMessages({id: 0, response: 42});
            expect(actualWarningEvent).to.deep.equal({
                type: 'warning',
                message: 'Received invalid JSON-RCP message from WebAPI. Message is not JSON-RCP 2.0 compliant. Ignoring it.\n' +
                '--------------------\n' +
                '{"id":0,"response":42}\n' +
                '--------------------'
            });

            webSocket.emulateIncomingMessages({jsonrcp: "2.0", response: 42});
            expect(actualWarningEvent).to.deep.equal({
                type: 'warning',
                message: 'Received invalid JSON-RCP message from WebAPI. Message is not JSON-RCP 2.0 compliant. Ignoring it.\n' +
                '--------------------\n' +
                '{"jsonrcp":"2.0","response":42}\n' +
                '--------------------'
            });

            webSocket.emulateIncomingMessages({jsonrcp: "2.0", id: 2, response: 42});
            expect(actualWarningEvent).to.deep.equal({
                type: 'warning',
                message: 'Received invalid JSON-RCP message from WebAPI. Method with "id"=2 has no associated job. Ignoring it.\n' +
                '--------------------\n' +
                '{"jsonrcp":"2.0","id":2,"response":42}\n' +
                '--------------------'
            });

        });
    });
});


describe('WebSocketMock', function () {
    class MyServiceObject {
        private state = 'me';

        processData = {};

        generateSausages(num, veggie) {
            if (num < -1) {
                throw Error('illegal num');
            }
            return {num, veggie, state: this.state};
        }
    }

    let webSocket;

    beforeEach(function () {
        webSocket = new WebSocketMock(0, new MyServiceObject());
    });

    it('calls methods of a service object', function () {

        let actualMessage;
        webSocket.onmessage = (event) => {
            actualMessage = event.data;
        };

        webSocket.send(JSON.stringify({
            jsonrcp: "2.0",
            id: 754934,
            method: 'generateSausages',
            params: [350, true]
        }));

        expect(JSON.parse(actualMessage)).to.deep.equal({
            jsonrcp: "2.0",
            id: 754934,
            response: {
                num: 350,
                veggie: true,
                state: "me"
            }
        });
    });

    it('catches exceptions from methods of a service object', function () {

        let actualMessage;
        webSocket.onmessage = (event) => {
            actualMessage = event.data;
        };

        webSocket.send(JSON.stringify({
            jsonrcp: "2.0",
            id: 754934,
            method: 'generateSausages',
            params: [-3, true]
        }));

        expect(JSON.parse(actualMessage)).to.deep.equal({
            jsonrcp: "2.0",
            id: 754934,
            error: {
                code: 2,
                message: "generateSausages(): Error: illegal num"
            }
        });
    });

    it('fails with an unknown method', function () {

        let actualMessage;
        webSocket.onmessage = (event) => {
            actualMessage = event.data;
        };

        webSocket.send(JSON.stringify({
            jsonrcp: "2.0",
            id: 754935,
            method: 'generateSteaks',
            params: [-3, true]
        }));

        expect(JSON.parse(actualMessage)).to.deep.equal({
            jsonrcp: "2.0",
            id: 754935,
            error: {
                code: 1,
                message: "generateSteaks(): no such method"
            }
        });
    });
});
