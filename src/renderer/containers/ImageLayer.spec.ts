const Cesium: any = require('cesium');


import {expect, should} from "chai";
import {VariableImageLayer} from "./ImageLayer";

should();

describe('updateProperty()', function () {

    it('works', function () {
        const imageLayer = new VariableImageLayer('http://localhost:9090/',
            'myws',
            'myres',
            'myvar',
            {numLevels: 5, tileWidth: 512, tileHeight: 256, numLevelZeroTilesX: 2, numLevelZeroTilesY: 1},
            {
                show: true,

                alpha: 0.9,
                brightness: 1.0,
                contrast: 1.0,
                gamma: 0.5,
                hue: 1.0,
                saturation: 1.0,

                colorMapName: 'jet',
                displayAlpha: false,
                displayMin: -2.5,
                displayMax: 2.5
            }
        );

        class ImageryLayers {
            layers = [];

            addImageryProvider(imageryProvider) {
                const imageryLayer = {};
                this.layers.push(imageryLayer);
                return imageryLayer;
            }
        }

        class CesiumMockViewer {

            imageryLayers: ImageryLayers;
            constructor() {
                this.imageryLayers = new ImageryLayers();
            }
        }

        const viewer = new CesiumMockViewer();
        imageLayer.updateLayer(viewer);
    });
});

