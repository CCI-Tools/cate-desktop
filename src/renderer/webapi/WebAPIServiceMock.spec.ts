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
        expect(serviceMock.getOperations()).to.have.length(121);
        expect(serviceMock.getOperations()[0].tags).to.have.length(1);
        expect(serviceMock.getOperations()[1].tags).to.have.length(1);
        expect(serviceMock.getOperations()[2].tags).to.have.length(2);
        expect(serviceMock.getOperations()[3].tags).to.have.length(3);
        expect(serviceMock.getOperations()[4].tags).to.have.length(4);
        expect(serviceMock.getOperations()[5].tags).to.have.length(1);
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
            base_dir: "scratch/workspace-0",
            description: null,
            is_scratch: true,
            is_modified: false,
            is_saved: false,
            is_open: true,
            workflow: {
                steps: []
            }
        });

        expect(serviceMock.newWorkspace()).to.deep.equal({
            base_dir: "scratch/workspace-1",
            description: null,
            is_scratch: true,
            is_modified: false,
            is_saved: false,
            is_open: true,
            workflow: {
                steps: []
            }
        });

        expect(serviceMock.saveWorkspaceAs("scratch/workspace-1", "ral/la/la")).to.deep.equal({
            base_dir: "ral/la/la",
            description: null,
            is_scratch: false,
            is_modified: false,
            is_saved: true,
            is_open: true,
            workflow: {
                steps: []
            }
        });

        expect(serviceMock.saveWorkspace("ral/la/la")).to.deep.equal({
            base_dir: "ral/la/la",
            description: null,
            is_scratch: false,
            is_modified: false,
            is_saved: true,
            is_open: true,
            workflow: {
                steps: []
            }
        });

        expect(serviceMock.closeWorkspace("ral/la/la")).to.deep.equal({
            base_dir: "ral/la/la",
            description: null,
            is_scratch: false,
            is_modified: false,
            is_saved: true,
            is_open: false,
            workflow: {
                steps: []
            }
        });

        expect(serviceMock.openWorkspace("ral/la/la")).to.deep.equal({
            base_dir: "ral/la/la",
            description: null,
            is_scratch: false,
            is_modified: false,
            is_saved: true,
            is_open: true,
            workflow: {
                steps: []
            }
        });

        expect(serviceMock.setWorkspaceResource("ral/la/la", 'resource_34', 'open_dataset', {})).to.deep.equal({
            base_dir: "ral/la/la",
            description: null,
            is_scratch: false,
            is_modified: true,
            is_saved: true,
            is_open: true,
            workflow: {
                steps: [
                    {
                        action: "open_dataset",
                        id: "resource_34",
                        inputs: [],
                        outputs: [],
                        type: "operation",
                    }
                ]
            }
        });
    });
});
