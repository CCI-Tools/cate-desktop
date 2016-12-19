import {VariableState, VariableImageLayerState, ImageLayout} from "../state";
const Cesium: any = require('cesium');

export class VariableImageLayer {
    readonly baseUrl: string;
    readonly baseDir: string;
    readonly resName: string;
    readonly varName: string;
    readonly imageLayout: ImageLayout;
    private _layerState: VariableImageLayerState;
    private _imageryProviderUrl: string;
    private _imageryLayer: any; /* :Cesium.ImageryLayer */

    constructor(baseUrl: string, baseDir: string, resName: string, varName: string, imageLayout: ImageLayout, layerState: VariableImageLayerState) {
        this.baseUrl = baseUrl;
        this.baseDir = baseDir;
        this.resName = resName;
        this.varName = varName;
        this.imageLayout = Object.assign({}, imageLayout);
        this._layerState = Object.assign({}, layerState);
        this._imageryProviderUrl = null;
        this._imageryLayer = null;
    }

    get layerState() {
        return this._layerState;
    }

    get imageryProviderUrl() {
        return this._imageryProviderUrl;
    }

    get imageryLayer() {
        return this._imageryLayer;
    }

    updateInViewer(viewer: any, layerState?: VariableImageLayerState): any {

        if (layerState) {
            this._layerState = Object.assign({}, this._layerState, layerState);
        }

        const imageryProviderUrl = this.createImageryProviderUrl();
        if (!this._imageryLayer || imageryProviderUrl !== this._imageryProviderUrl) {
            const imageLayout = this.imageLayout;
            // see https://cesiumjs.org/Cesium/Build/Documentation/UrlTemplateImageryProvider.html
            const imageryProvider = new Cesium.UrlTemplateImageryProvider({
                url: imageryProviderUrl,
                // # todo - use imageConfig.sector to specify 'rectangle' option. See backend todo.
                // rectangle: imageLayout.sector,
                minimumLevel: 0,
                maximumLevel: imageLayout.numLevels - 1,
                tileWidth: imageLayout.tileWidth,
                tileHeight: imageLayout.tileHeight,
                tilingScheme: new Cesium.GeographicTilingScheme({
                    numberOfLevelZeroTilesX: imageLayout.numLevelZeroTilesX,
                    numberOfLevelZeroTilesY: imageLayout.numLevelZeroTilesY
                })
            });

            const oldLayer = this._imageryLayer;
            let imageryLayer;
            if (oldLayer != null) {
                // Insert new layer at position of old layer
                const oldIndex = viewer.imageryLayers.indexOf(oldLayer);
                imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider, oldIndex);
                viewer.imageryLayers.remove(oldLayer, true);
            } else {
                // Append new layer
                imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider);
            }

            this._imageryProviderUrl = imageryProviderUrl;
            this._imageryLayer = imageryLayer;
        }

        this._imageryLayer.name = `${this.resName}/${this.varName}`;
        this._imageryLayer.show = this._layerState.show;
        this._imageryLayer.alpha = this._layerState.alpha;
        this._imageryLayer.brightness = this._layerState.brightness;
        this._imageryLayer.contrast = this._layerState.contrast;
        this._imageryLayer.hue = this._layerState.hue;
        this._imageryLayer.saturation = this._layerState.saturation;
        this._imageryLayer.gamma = this._layerState.gamma;

        return this._imageryLayer;
    }

    /**
     * Destroys the variable's imagery layer, if any.
     */
    removeFromViewer(viewer: any): any {
        const oldLayer = this._imageryLayer;
        if (this._imageryLayer !== null) {
            console.log('Destroying imagery layer "' + this._imageryLayer.name + '"');
            viewer.imageryLayers.remove(this.imageryLayer, true);
            this._imageryLayer = null;
            this._imageryProviderUrl = null;
        }
        return oldLayer;
    }

    private createImageryProviderUrl() {
        return this.baseUrl + `ws/res/tile/${encodeURIComponent(this.baseDir)}/${encodeURIComponent(this.resName)}/{z}/{y}/{x}.png?`
            + `&var=${encodeURIComponent(this.varName)}`
            + `&cmap=${encodeURIComponent(this.layerState.colorMapName) + (this.layerState.displayAlpha ? '_alpha' : '')}`
            + `&min=${encodeURIComponent(this.layerState.displayMin + '')}`
            + `&max=${encodeURIComponent(this.layerState.displayMax + '')}`;
    }
}
