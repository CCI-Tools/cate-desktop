import {VariableImageLayerState} from "../state";
const Cesium: any = require('cesium');


import {expect} from "chai";
import {VariableImageLayer} from "./ImageLayer";


class CesiumViewerMock {

    imageryLayers: ImageryLayersMock;

    constructor() {
        this.imageryLayers = new ImageryLayersMock();
    }
}


class ImageryLayersMock {
    layerList = [];

    addImageryProvider(imageryProvider) {
        const imageryLayer = {};
        this.layerList.push(imageryLayer);
        return imageryLayer;
    }

    indexOf(layer: any) {
        return this.layerList.findIndex(l => l === layer);
    }

    remove(layer: any) {
        const index = this.indexOf(layer);
        if (index >= 0) {
            this.layerList.splice(index, 1);
        }
    }
}

describe('VariableImageLayer', function () {

    let viewer: CesiumViewerMock = null;
    let imageLayer: VariableImageLayer = null;

    beforeEach(function () {
        viewer = new CesiumViewerMock();
        imageLayer = new VariableImageLayer('http://localhost:9090/',
            'myws',
            'myres',
            'myvar',
            {numLevels: 5, tileWidth: 512, tileHeight: 256, numLevelZeroTilesX: 2, numLevelZeroTilesY: 1},
            {
                id: 'myres/myvar',
                name: 'myvar',
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
    });

    it('#updateInViewer', function () {
        const imageryLayer1 = imageLayer.updateInViewer(viewer);
        expect(viewer.imageryLayers.layerList).to.deep.equal([imageryLayer1]);

        const imageryLayer2 = imageLayer.updateInViewer(viewer, {alpha: 0.1, saturation: 0.9} as VariableImageLayerState);
        expect(imageryLayer1).to.be.eq(imageryLayer2);
        expect(viewer.imageryLayers.layerList).to.deep.equal([imageryLayer1]);

        const imageryLayer3 = imageLayer.updateInViewer(viewer, {displayMin: 0} as VariableImageLayerState);
        expect(imageryLayer1).not.to.be.eq(imageryLayer3);
        expect(viewer.imageryLayers.layerList).to.deep.equal([imageryLayer3]);
    });

    it('#removeFromViewer', function () {
        const imageryLayer1 = imageLayer.updateInViewer(viewer);
        const imageryLayer2 = imageLayer.removeFromViewer(viewer);
        expect(imageryLayer1).to.be.eq(imageryLayer2);
        expect(viewer.imageryLayers.layerList).to.deep.equal([]);
    });

    it('#imageryProviderUrl', function () {
        const imageryLayer = imageLayer.updateInViewer(viewer);
        expect(imageLayer.imageryProviderUrl).to.equal('http://localhost:9090/ws/res/tile/myws/myres/{z}/{y}/{x}.png' +
            '?&var=myvar&cmap=jet&min=-2.5&max=2.5');
    });
});

