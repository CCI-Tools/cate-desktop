import {should, expect} from 'chai';
import {JobStatus, WebAPI, JobProgress, JobFailure} from './webapi';

should();

class WebSocketMock {
    messageTrace: string[] = [];

    emulateOnMessage(...messages: Object[]) {
        for (let i = 0; i < messages.length; i++) {
            const event = {data: JSON.stringify(messages[i])};
            this.onmessage(event);
        }
    }

    ////////////////////////////////////////////
    // >>>> WebSocket interface impl.

    onmessage: (this: this, ev: any) => any;
    //onclose: (this: this, ev: any) => any;
    //onerror: (this: this, ev: any) => any;
    //onopen: (this: this, ev: any) => any;

    send(message: string) {
        this.messageTrace.push(message);
    }

    // <<<< WebSocket interface impl.
    ////////////////////////////////////////////
}

describe('WebAPI', function () {
    it('calls "then" if done', function () {
        const webSocket: any = new WebSocketMock();
        const webAPI = new WebAPI('ws://test/me/now', 0, webSocket);

        let actualResult = false;
        const job = webAPI.submit('openWorkspace', {path: 'bibo'})
            .then((result: any) => {
                actualResult = result;
            });

        expect(job.status).to.equal(JobStatus.SUBMITTED);

        webSocket.emulateOnMessage(
            {
                jsonrcp: "2.0",
                id: 0,
                response: 'ok',
            }
        );

        expect(job.status).to.equal(JobStatus.DONE);
        expect(actualResult).to.equal('ok');
    });

    it('calls "during" while running', function () {
        const webSocket: any = new WebSocketMock();
        const webAPI = new WebAPI('ws://test/me/now', 769, webSocket);

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

        webSocket.emulateOnMessage(
            {
                jsonrcp: "2.0",
                id: 769,
                progress: {
                    worked: 30,
                    total: 100
                },
            },
            {
                jsonrcp: "2.0",
                id: 769,
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

        webSocket.emulateOnMessage(
            {
                jsonrcp: "2.0",
                id: 769,
                response: 42,
            }
        );

        expect(job.status).to.equal(JobStatus.DONE);
        expect(actualResult).to.equal(42);
    });

    it('calls "failed" on failure', function () {
        const webSocket: any = new WebSocketMock();
        const webAPI = new WebAPI('ws://test/me/now', 9421, webSocket);

        let actualFailure: JobFailure;
        const job = webAPI.submit('executeOp', {op: 'average', params: {dsId: 53242}})
            .failed((failure: JobFailure) => {
                actualFailure = failure;
            });

        webSocket.emulateOnMessage(
            {
                jsonrcp: "2.0",
                id: 9421,
                error: {
                    message: 'out of memory',
                    code: 512,
                },
            }
        );

        expect(job.status).to.equal(JobStatus.FAILED);
        expect(actualFailure).to.deep.equal({
                message: 'out of memory',
                code: 512,
        });
    });


    it('calls "failed" on cancellation', function () {
        const webSocket: any = new WebSocketMock();
        const webAPI = new WebAPI('ws://test/me/now', 9421, webSocket);

        let actualFailure: JobFailure;
        const job = webAPI.submit('executeOp', {op: 'average', params: {dsId: 53242}})
            .failed((failure: JobFailure) => {
                actualFailure = failure;
            });

        webSocket.emulateOnMessage(
            {
                jsonrcp: "2.0",
                id: 9421,
                error: {
                    cancelled: true,
                },
            }
        );

        expect(job.status).to.equal(JobStatus.CANCELLED);
        expect(job.isCancelled()).to.be.true;
        expect(actualFailure).to.deep.equal({
            cancelled: true,
        });
    });
});
