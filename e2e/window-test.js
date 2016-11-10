const Application = require('spectron').Application;
const path = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.should();
chai.use(chaiAsPromised);

var electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');

if (process.platform === 'win32') {
    electronPath += '.cmd';
}

var appPath = path.join(__dirname, '..', 'app');


// This will make WebStorm happy:
beforeEach = global.beforeEach;
afterEach = global.afterEach;
describe = global.describe;
it = global.it;

describe('testing app launch', function () {
    this.timeout(10000);

    beforeEach(function () {
        this.app = new Application({
            path: electronPath,
            args: [appPath]
        });
        return this.app.start();
    });

    beforeEach(function () {
        chaiAsPromised.transferPromiseness = this.app.transferPromiseness;
    });

    afterEach(function () {
        if (this.app && this.app.isRunning()) {
            return this.app.stop();
        }
    });

    it('opens at least one window', function () {
        return this.app.client.waitUntilWindowLoaded()
            .getWindowCount().should.eventually.be.above(0)
    });

    it('has a certain main window', function () {
        return this.app.client.waitUntilWindowLoaded()
            .browserWindow.isMinimized().should.eventually.be.false
            .browserWindow.isDevToolsOpened().should.eventually.be.true
            .browserWindow.isVisible().should.eventually.be.true
            .browserWindow.isFocused().should.eventually.be.false
            .browserWindow.getBounds().should.eventually.have.property('width').and.be.above(0)
            .browserWindow.getBounds().should.eventually.have.property('height').and.be.above(0)
    });

    it('has title', function () {
        return this.app.client.waitUntilWindowLoaded()
            .browserWindow.getTitle().should.eventually.equal('Cate');
    });
});

