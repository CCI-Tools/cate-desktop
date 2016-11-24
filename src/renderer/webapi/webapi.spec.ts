import {should, expect} from 'chai';
import {Job, JobStatus, WebAPI, DatasetAPI, WorkspaceAPI} from './webapi';

should();

class WebSocketMock {
    messageTrace: string[] = [];

    onclose: (this: this, ev: any) => any;
    onerror: (this: this, ev: any) => any;
    onmessage: (this: this, ev: any) => any;
    onopen: (this: this, ev: any) => any;

    emulateMessage(ev: any) {
        this.onmessage(ev);
    }

    send(message: string) {
        this.messageTrace.push(message);
    }
}

describe('WebAPI', function () {
    it('#sendMessage', function () {
        const webSocket: any = new WebSocketMock();
        const webAPI = new WebAPI('ws://test/me/now', 0, webSocket);

        let thenCalled = false;
        const job = webAPI.sendMessage('openWorkspace', {path: 'bibo'})
            .then(() => {
                thenCalled = true;
            })
            .failed(() => {

            });
        webSocket.emulateMessage({data: JSON.stringify({
            jsonrcp: "2.0",
            id: 0,
            response: 'ok',
        })});

        expect(thenCalled).to.be.true;
    });
});
