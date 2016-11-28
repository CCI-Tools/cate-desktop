import {should, expect} from 'chai';
import {JobStatus, WebAPI, JobProgress, JobFailure, openWebAPI} from './webapi';

should();

class WebSocketMock {
    messageTrace: string[] = [];

    emulateIncomingMessages(...messages: Object[]) {
        for (let i = 0; i < messages.length; i++) {
            const event = {data: JSON.stringify(messages[i])};
            let x = this.onmessage(event);
        }
    }

    emulateOpen(event) {
        this.onopen(event);
    }

    emulateError(event) {
        this.onerror(event);
    }

    emulateClose(event) {
        this.onclose(event);
    }

    ////////////////////////////////////////////
    // >>>> WebSocket interface impl.

    onmessage: (this: this, ev: any) => any;
    onopen: (this: this, ev: any) => any;
    onerror: (this: this, ev: any) => any;
    onclose: (this: this, ev: any) => any;

    send(message: string) {
        this.messageTrace.push(message);
    }

    // <<<< WebSocket interface impl.
    ////////////////////////////////////////////
}

describe('WebAPI callbacks', function () {

    let webSocket;
    let webAPI;

    beforeEach(function() {
        webSocket = new WebSocketMock();
        webAPI = openWebAPI('ws://test/me/now', 0, webSocket);
    });

    it('calls "then" callback if done', function () {
        let actualResult = false;
        const job = webAPI.submit('openWorkspace', {path: 'bibo'})
            .then((result: any) => {
                actualResult = result;
            });

        expect(job.status).to.equal(JobStatus.SUBMITTED);

        webSocket.emulateIncomingMessages(
            {
                jsonrcp: "2.0",
                id: 0,
                response: 'ok',
            }
        );

        expect(job.status).to.equal(JobStatus.DONE);
        expect(actualResult).to.equal('ok');
    });

    it('calls "during" callback while running', function () {

        let actualResult = false;
        let actualProgress: JobProgress[] = [];
        const job = webAPI.submit('executeOp', {op: 'average', params: {dsId: 53242}})
            .then((res) => {
                actualResult = res;
            })
            .during((progress: JobProgress) => {
                actualProgress.push(progress);
            });

        expect(job.status).to.equal(JobStatus.SUBMITTED);

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
        );

        expect(job.status).to.equal(JobStatus.RUNNING);
        expect(actualProgress).to.deep.equal([
            {worked: 30, total: 100},
            {worked: 60, total: 100, message: 'warning: low memory'}
        ]);

        webSocket.emulateIncomingMessages(
            {
                jsonrcp: "2.0",
                id: 0,
                response: 42,
            }
        );

        expect(job.status).to.equal(JobStatus.DONE);
        expect(actualResult).to.equal(42);
    });

    it('calls "failed" callback on failure', function () {
        let actualFailure: JobFailure;
        const job = webAPI.submit('executeOp', {op: 'average', params: {dsId: 53242}})
            .failed((failure: JobFailure) => {
                actualFailure = failure;
            });

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

        expect(job.status).to.equal(JobStatus.FAILED);
        expect(job.cancelled).to.be.false;
        expect(actualFailure).to.deep.equal({
            message: 'out of memory',
            code: 512,
        });
    });


    it('calls "failed" callback on cancellation', function () {
        let actualFailure: JobFailure;
        const job = webAPI.submit('executeOp', {op: 'average', params: {dsId: 53242}})
            .failed((failure: JobFailure) => {
                actualFailure = failure;
            });

        webSocket.emulateIncomingMessages(
            {
                jsonrcp: "2.0",
                id: 0,
                error: {
                    code: 999,
                    message: 'killed'
                },
            }
        );

        expect(job.status).to.equal(JobStatus.CANCELLED);
        expect(job.cancelled).to.be.true;
        expect(actualFailure).to.deep.equal({
            code: 999,
            message: 'killed'
        });
    });
});

describe('WebAPI handlers', function () {
    let webSocket;
    let webAPI;

    beforeEach(function() {
        webSocket = new WebSocketMock();
        webAPI = openWebAPI('ws://test/me/now', 0, webSocket);
    });


    it('notifies on open/error/close handlers', function () {
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

    it('notifies on warning handlers', function () {
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
