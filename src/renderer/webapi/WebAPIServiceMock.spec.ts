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

    it('can call operations', function () {
        expect(serviceMock.callOperation('open_dataset', {
            ds_name: 'bibo',
            start_date: 2010,
            end_date: 2012
        })).to.deep.equal({
            opName: 'open_dataset',
            opArgs: {
                ds_name: 'bibo',
                start_date: 2010,
                end_date: 2012
            },
        });
    });

    it('can deal with workspaces', function () {
        expect(serviceMock.newWorkspace()).to.deep.equal({
            baseDir: "scratch/workspace-0",
            description: null,
            isScratch: true,
            isModified: false,
            isSaved: false,
            isOpen: true,
            workflow: {
                steps: []
            }
        });

        expect(serviceMock.newWorkspace()).to.deep.equal({
            baseDir: "scratch/workspace-1",
            description: null,
            isScratch: true,
            isModified: false,
            isSaved: false,
            isOpen: true,
            workflow: {
                steps: []
            }
        });

        expect(serviceMock.saveWorkspaceAs("scratch/workspace-1", "ral/la/la")).to.deep.equal({
            baseDir: "ral/la/la",
            description: null,
            isScratch: false,
            isModified: false,
            isSaved: true,
            isOpen: true,
            workflow: {
                steps: []
            }
        });

        expect(serviceMock.saveWorkspace("ral/la/la")).to.deep.equal({
            baseDir: "ral/la/la",
            description: null,
            isScratch: false,
            isModified: false,
            isSaved: true,
            isOpen: true,
            workflow: {
                steps: []
            }
        });

        expect(serviceMock.closeWorkspace("ral/la/la")).to.deep.equal({
            baseDir: "ral/la/la",
            description: null,
            isScratch: false,
            isModified: false,
            isSaved: true,
            isOpen: false,
            workflow: {
                steps: []
            }
        });

        expect(serviceMock.openWorkspace("ral/la/la")).to.deep.equal({
            baseDir: "ral/la/la",
            description: null,
            isScratch: false,
            isModified: false,
            isSaved: true,
            isOpen: true,
            workflow: {
                steps: []
            }
        });

    });

});
