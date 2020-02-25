import { expect } from 'chai';
import { convertLayersToLayerDescriptors, transferEntityGeometry } from './globe-view-layers';
import { FeatureCollection } from 'geojson';
import { Placemark, PlacemarkCollection } from '../state';
import { COUNTRIES_LAYER, COUNTRIES_LAYER_ID, MY_PLACES_LAYER, MY_PLACES_LAYER_ID } from '../state-util';

describe('convertLayersToLayerDescriptors', function () {
    it('converts correctly', function () {

        const baseDir = 'hotte';
        const baseUrl = 'http://localhost/';

        let layers, resources, descriptors;

        layers = [
            {...COUNTRIES_LAYER},
            {
                id: 'L423',
                name: 'I has a bucket',
                type: 'ResourceVector',
                visible: true,
                resId: 1,
                style: {
                    fill: '#FFA500',
                    fillOpacity: 0.3
                }
            },
            {...MY_PLACES_LAYER},
            {
                id: 'L427',
                name: 'I love ma bucket',
                type: 'VariableImage',
                visible: true,
                resId: 2,
                varName: 'sst',
            }
        ];
        resources = [
            {
                id: 1,
                name: 'res_1'
            },
            {
                id: 2,
                name: 'res_2',
                variables: [
                    {
                        name: 'sst',
                        imageLayout: {
                            numLevels: 5,
                            tileWidth: 360,
                            tileHeight: 180,
                            numLevelZeroTilesX: 1,
                            numLevelZeroTilesY: 1,
                            extent: {west: -180., south: -90., east: 180., north: 90.},
                        }
                    }
                ]
            },
        ];

        const placemarks = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    id: '0',
                    geometry: {
                        type: 'Point',
                        coordinates: [10.0, 20.0]
                    },
                    properties: {
                        title: 'Pin 1',
                        description: 'I has a bucket'
                    }
                } as Placemark,
                {
                    type: 'Feature',
                    id: '1',
                    geometry: {
                        type: 'Point',
                        coordinates: [10.2, 20.3]
                    },
                    properties: {
                        title: 'Pin 2',
                        description: 'No, this is ma bucket'
                    }
                } as Placemark,
            ]
        } as PlacemarkCollection;

        descriptors = convertLayersToLayerDescriptors([], resources, placemarks, baseUrl, baseDir);
        expect(descriptors).to.deep.equal({});

        descriptors = convertLayersToLayerDescriptors(layers, resources, placemarks, baseUrl, baseDir);
        expect(descriptors.vectorLayerDescriptors).to.have.length(3);
        expect(descriptors.imageLayerDescriptors).to.have.length(1);

        const vld1 = descriptors.vectorLayerDescriptors[0];
        const vld2 = descriptors.vectorLayerDescriptors[1];
        const vld3 = descriptors.vectorLayerDescriptors[2];
        const ild = descriptors.imageLayerDescriptors[0];

        expect(vld1.id).to.equal(COUNTRIES_LAYER_ID);
        expect(vld1.name).to.equal('Countries');
        expect(vld1.visible).to.be.false;
        expect(vld1.dataSource).to.be.a('function');
        expect(vld1.dataSourceOptions).to.deep.equal({
                                                         data: 'http://localhost/ws/countries',
                                                         style: COUNTRIES_LAYER.style
                                                     });

        expect(vld2.id).to.equal('L423');
        expect(vld2.name).to.equal('I has a bucket');
        expect(vld2.visible).to.be.true;
        expect(vld2.resId).to.equal(1);
        expect(vld2.dataSource).to.be.a('function');
        expect(vld2.dataSourceOptions).to.deep.equal({
                                                         resId: 1,
                                                         data: 'http://localhost/ws/res/geojson/hotte/1',
                                                         style: {
                                                             fill: '#FFA500',
                                                             fillOpacity: 0.3
                                                         }
                                                     });

        expect(vld3.id).to.equal(MY_PLACES_LAYER_ID);
        expect(vld3.name).to.equal('My Places');
        expect(vld3.visible).to.be.true;
        expect(vld3.dataSource).to.be.a('function');
        expect(vld3.dataSourceOptions).to.deep.equal({
                                                         data: placemarks,
                                                         style: MY_PLACES_LAYER.style
                                                     });

        expect(ild.id).to.equal('L427');
        expect(ild.name).to.equal('I love ma bucket');
        expect(ild.visible).to.be.true;
        expect(ild.type).to.be.equal('VariableImage');
        expect(ild.resId).to.equal(2);
        expect(ild.varName).to.equal('sst');
        expect(ild.imageryProvider).to.be.a('function');
        expect(ild.imageryProviderOptions).to.exist;
        expect(ild.imageryProviderOptions.minimumLevel).to.equal(0);
        expect(ild.imageryProviderOptions.maximumLevel).to.equal(4);
        expect(ild.imageryProviderOptions.tileWidth).to.equal(360);
        expect(ild.imageryProviderOptions.tileHeight).to.equal(180);
        expect(ild.imageryProviderOptions.rectangle).to.exist;
        expect(ild.imageryProviderOptions.rectangle.west).to.equal(-Math.PI);
        expect(ild.imageryProviderOptions.rectangle.south).to.equal(-Math.PI / 2);
        expect(ild.imageryProviderOptions.rectangle.east).to.equal(Math.PI);
        expect(ild.imageryProviderOptions.rectangle.north).to.equal(Math.PI / 2);
        expect(ild.imageryProviderOptions.tilingScheme).to.exist;
    });
});

describe('transferEntityGeometry', function () {
    it('transfers correctly', function () {
        let fromEntity = {
            polygon: {},
        } as any;
        let toEntity = {
            point: {},
            _simp: 1,
        } as any;
        transferEntityGeometry(fromEntity, toEntity);
        expect(toEntity).to.contain.keys('polygon', 'point');
        expect(toEntity.polygon).to.exist;
        expect(toEntity.point).to.be.undefined;
        expect(toEntity._simp).to.equal(0); // = cleared geometry simplification flag
    });
});
