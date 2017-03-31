import {WebAPIServiceMock} from './WebAPIServiceMock'
import {expect} from 'chai';

describe('WebAPIServiceMock', function () {
    let serviceMock;

    beforeEach(function () {
        serviceMock = new WebAPIServiceMock();
    });

    it('has data stores', function () {
        expect(serviceMock.get_data_stores()).to.have.length(5);
    });

    it('has data sources', function () {
        expect(serviceMock.get_data_sources('data.store.0')).to.have.length(12);
        expect(serviceMock.get_data_sources('data.store.1')).to.have.length(300);
    });

    it('has operations', function () {
        expect(serviceMock.get_operations()).to.have.length(121);
        expect(serviceMock.get_operations()[0].tags).to.have.length(1);
        expect(serviceMock.get_operations()[1].tags).to.have.length(1);
        expect(serviceMock.get_operations()[2].tags).to.have.length(2);
        expect(serviceMock.get_operations()[3].tags).to.have.length(3);
        expect(serviceMock.get_operations()[4].tags).to.have.length(4);
        expect(serviceMock.get_operations()[5].tags).to.have.length(1);
    });

    it('can call operations', function () {
        expect(serviceMock.call_operation('open_dataset', {
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
        expect(serviceMock.new_workspace()).to.deep.equal({
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

        expect(serviceMock.new_workspace()).to.deep.equal({
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

        expect(serviceMock.save_workspace_as("scratch/workspace-1", "ral/la/la")).to.deep.equal({
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

        expect(serviceMock.save_workspace("ral/la/la")).to.deep.equal({
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

        expect(serviceMock.close_workspace("ral/la/la")).to.deep.equal({
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

        expect(serviceMock.open_workspace("ral/la/la")).to.deep.equal({
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

        expect(serviceMock.set_workspace_resource("ral/la/la", 'resource_34', 'open_dataset', {})).to.deep.equal({
            base_dir: "ral/la/la",
            description: null,
            is_scratch: false,
            is_modified: true,
            is_saved: true,
            is_open: true,
            workflow: {
                steps: [
                    {
                        op: "open_dataset",
                        id: "resource_34",
                        input: {},
                        output: {},
                        type: "operation",
                    }
                ]
            },
            "resources": [
                {
                    "dataType": "Dataset",
                    "name": "resource_34",
                    "variables": [
                        {
                            "dataType": "float32",
                            "dimensions": [
                                "lat",
                                "lon",
                            ],
                            "imageLayout": {
                                "numLevelZeroTilesX": 2,
                                "numLevelZeroTilesY": 1,
                                "numLevels": 5,
                                "tileHeight": 256,
                                "tileWidth": 512,
                            },
                            "name": "var_a_resource_34",
                            "ndim": 2,
                            "shape": [
                                420,
                                840,
                            ],
                            "units": "si",
                        },
                        {
                            "dataType": "float32",
                            "dimensions": [
                                "lat",
                                "lon",
                            ],
                            "imageLayout": {
                                "numLevelZeroTilesX": 2,
                                "numLevelZeroTilesY": 1,
                                "numLevels": 5,
                                "tileHeight": 256,
                                "tileWidth": 512
                            },
                            "name": "var_b_resource_34",
                            "ndim": 2,
                            "shape": [
                                420,
                                840,
                            ],
                            "units": "si"
                        },
                        {
                            "dataType": "float32",
                            "dimensions": [
                                "lat",
                                "lon",
                            ],
                            "imageLayout": {
                                "numLevelZeroTilesX": 2,
                                "numLevelZeroTilesY": 1,
                                "numLevels": 5,
                                "tileHeight": 256,
                                "tileWidth": 512,
                            },
                            "name": "var_c_resource_34",
                            "ndim": 2,
                            "shape": [
                                420,
                                840,
                            ],
                            "units": "si",
                        },
                        {
                            "dataType": "float32",
                            "dimensions": [
                                "lat",
                                "lon",
                            ],
                            "imageLayout": {
                                "numLevelZeroTilesX": 2,
                                "numLevelZeroTilesY": 1,
                                "numLevels": 5,
                                "tileHeight": 256,
                                "tileWidth": 512,
                            },
                            "name": "var_d_resource_34",
                            "ndim": 2,
                            "shape": [
                                420,
                                840,
                            ],
                            "units": "si",
                        }
                    ]
                }
            ]
        });
    });
});
