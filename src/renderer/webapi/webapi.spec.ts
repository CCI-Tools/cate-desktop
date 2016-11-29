import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {JobStatus, WebAPI, JobProgress, JobFailure, openWebAPI, JobResponse, WebSocketMock} from './webapi';

const expect = chai.expect;
chai.should();
chai.use(chaiAsPromised);


describe('WebAPI', function () {

    let webSocket;
    let webAPI;

    beforeEach(function () {
        webSocket = new WebSocketMock();
        webAPI = openWebAPI('ws://test/me/now', 0, webSocket);
    });

    describe('Promise', function () {
        it('calls "then" callback if done', function () {
            let actualResult;
            const job = webAPI.call('openWorkspace', {path: 'bibo'});
            webSocket.emulateIncomingMessages(
                {
                    jsonrcp: "2.0",
                    id: 0,
                    response: 'ok',
                }
            );
            return expect(job).to.eventually.equal('ok');
        });

        it('calls "during" callback while running', function () {

        });

        it('calls "failed" callback on failure', function () {
        });


        it('calls "failed" callback on cancellation', function () {
        });
    });

    describe('Job status', function () {

        let webSocket;
        let webAPI;

        beforeEach(function () {
            webSocket = new WebSocketMock();
            webAPI = openWebAPI('ws://test/me/now', 0, webSocket);
        });

        it('changes status to done', function () {
            const job = webAPI.call('openWorkspace', {path: 'bibo'});
            expect(job.getStatus()).to.equal(JobStatus.SUBMITTED);
            webSocket.emulateIncomingMessages(
                {
                    jsonrcp: "2.0",
                    id: 0,
                    response: 'ok',
                }
            );
            expect(job.getStatus()).to.equal(JobStatus.DONE);
        });

        it('changes status to failed', function () {
            const job = webAPI.call('openWorkspace', {path: 'bibo'});
            expect(job.getStatus()).to.equal(JobStatus.SUBMITTED);
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
            expect(job.getStatus()).to.equal(JobStatus.FAILED);
        });

        it('changes status to cancelled', function () {
            const job = webAPI.call('openWorkspace', {path: 'bibo'});
            expect(job.getStatus()).to.equal(JobStatus.SUBMITTED);
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
            expect(job.getStatus()).to.equal(JobStatus.CANCELLED);
        });

        it('changes status while progressing and then to done', function () {
            const job = webAPI.call('openWorkspace', {path: 'bibo'});
            expect(job.getStatus()).to.equal(JobStatus.SUBMITTED);

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
            expect(job.getStatus()).to.equal(JobStatus.IN_PROGRESS);

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
            expect(job.getStatus()).to.equal(JobStatus.IN_PROGRESS);

            webSocket.emulateIncomingMessages(
                {
                    jsonrcp: "2.0",
                    id: 0,
                    response: 'ok',
                }
            );
            expect(job.getStatus()).to.equal(JobStatus.DONE);
        });
    });

    describe('WebAPI handlers', function () {

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

            webSocket.emulateIncomingMessages({id: 0, response: 42});
            expect(actualWarningEvent).to.deep.equal({
                message: 'Received invalid Cate WebAPI message (id: 0). ' +
                'Ignoring it.'
            });

            webSocket.emulateIncomingMessages({jsonrcp: "2.0", response: 42});
            expect(actualWarningEvent).to.deep.equal({
                message: 'Received invalid Cate WebAPI message (id: undefined). ' +
                'Ignoring it.'
            });

            webSocket.emulateIncomingMessages({jsonrcp: "2.0", id: 2, response: 42});
            expect(actualWarningEvent).to.deep.equal({
                message: 'Received Cate WebAPI message (id: 2), ' +
                'which does not have an associated job. Ignoring it.'
            });

        });
    });
});
