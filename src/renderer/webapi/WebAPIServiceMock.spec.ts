import {WebAPIServiceMock} from './WebAPIServiceMock'
import {expect} from 'chai';

describe('WebAPIServiceMock', function () {
    let serviceMock;

    beforeEach(function () {
        serviceMock = new WebAPIServiceMock();
    });

    it('has data stores', function () {
        expect(serviceMock.getDataStores()).to.have.length(5);
    });

    it('has data sources', function () {
        expect(serviceMock.getDataSources('data.store.0')).to.have.length(12);
        expect(serviceMock.getDataSources('data.store.1')).to.have.length(300);
    });

    it('has operations', function () {
        expect(serviceMock.getOperations()).to.have.length(120);
        expect(serviceMock.getOperations()[0].tags).to.have.length(1);
        expect(serviceMock.getOperations()[1].tags).to.have.length(2);
        expect(serviceMock.getOperations()[2].tags).to.have.length(3);
        expect(serviceMock.getOperations()[3].tags).to.have.length(4);
        expect(serviceMock.getOperations()[4].tags).to.have.length(1);
    });

    it('can deal with workspaces', function () {
        expect(serviceMock.newWorkspace()).to.deep.equal({
            path: "{workspace-0}",
            isOpen: true,
            isSaved: false,
            workflow: null
        });

        expect(serviceMock.newWorkspace()).to.deep.equal({
            path: "{workspace-1}",
            isOpen: true,
            isSaved: false,
            workflow: null
        });

        expect(serviceMock.saveWorkspaceAs("{workspace-1}", "ral/la/la")).to.deep.equal({
            path: "ral/la/la",
            isOpen: true,
            isSaved: true,
            workflow: null
        });

        expect(serviceMock.saveWorkspace("ral/la/la")).to.deep.equal({
            path: "ral/la/la",
            isOpen: true,
            isSaved: true,
            workflow: null
        });

        expect(serviceMock.closeWorkspace("ral/la/la")).to.deep.equal({
            path: "ral/la/la",
            isOpen: false,
            isSaved: true,
            workflow: null
        });

        expect(serviceMock.openWorkspace("ral/la/la")).to.deep.equal({
            path: "ral/la/la",
            isOpen: true,
            isSaved: true,
            workflow: null
        });

    });

});
