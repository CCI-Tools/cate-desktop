import * as React from 'react';
import {IPermanentComponentProps, PermanentComponent} from '../PermanentComponent'
import {getLayerDiff} from "../Layer";

const Cesium: any = require('cesium');
// console.log(Cesium);
const BuildModuleUrl: any = Cesium.buildModuleUrl;
BuildModuleUrl.setBaseUrl('./');

////////////////////////////////////////////////////////////////////////////////////////////////
// As long as we don't have a @types/Cesium dependency, we provide Cesium dummy types here:
//
// << begin @types/Cesium
export type ImageryProvider = any;
export type ImageryLayer = any;
export type ImageryLayerCollection = {
    addImageryProvider: (provider: ImageryProvider, index: number) => ImageryLayer;
    get: (index: number) => ImageryLayer;
    indexOf: (layer: ImageryLayer) => number;
    remove: (layer: ImageryLayer, destroy?: boolean) => void;
    raise: (layer: ImageryLayer) => void;
    lower: (layer: ImageryLayer) => void;
};

export type CesiumViewer = {
    container: HTMLElement;
    entities: any;
    imageryLayers: ImageryLayerCollection;
};
// >> end @types/Cesium
////////////////////////////////////////////////////////////////////////////////////////////////


/**
 * Describes a "pin" to be displayed on the Cesium globe.
 */
export interface PinDescriptor {
    id: string;
    name?: string|null;
    visible: boolean;
    image: string;
    state: string;
    latitude: number;
    longitude: number;
}

/**
 * Describes an image layer to be displayed on the Cesium globe.
 */
export interface LayerDescriptor {
    id: string;
    name?: string|null;
    visible: boolean;
    opacity?: number;
    brightness?: number;
    contrast?: number;
    hue?: number;
    saturation?: number;
    gamma?: number;

    imageryProvider: (options: any) => ImageryProvider | ImageryProvider;
    imageryProviderOptions?: any;
}

// Bing Maps Key associated with Account Id 1441410 (= norman.fomferra@brockmann-consult.de)
// * Application Name: CCI Toolbox
// * Key / Application Type: Basic / Dev/Test
// * Application URL: http://cci.esa.int/
//
Cesium.BingMapsApi.defaultKey = 'AnCcpOxnAAgq-KyFcczSZYZ_iFvCOmWl0Mx-6QzQ_rzMtpgxZrPZZNxa8_9ZNXci';


export interface ICesiumGlobeProps extends IPermanentComponentProps {
    offlineMode?: boolean;
    pins?: PinDescriptor[];
    layers?: LayerDescriptor[];
}

const CENTRAL_EUROPE_BOX = Cesium.Rectangle.fromDegrees(-30, 20, 40, 80);
Cesium.Camera.DEFAULT_VIEW_RECTANGLE = CENTRAL_EUROPE_BOX;
Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;

/**
 * A component that wraps a Cesium 3D Globe.
 *
 * @author Norman Fomferra
 */
export class CesiumGlobe extends PermanentComponent<CesiumViewer, ICesiumGlobeProps, any> {

    private lastLayers: LayerDescriptor[];

    constructor(props: ICesiumGlobeProps) {
        super(props);
        this.lastLayers = null;
    }

    get viewer(): CesiumViewer {
        return this.permanentObject;
    }

    createPermanentObject(): CesiumViewer {
        const container = this.createContainer();

        let baseLayerImageryProvider;
        if (this.props.offlineMode) {
            const baseUrl = Cesium.buildModuleUrl('');
            const imageryProviderOptions = {
                url: baseUrl + 'Assets/Textures/NaturalEarthII/{z}/{x}/{reverseY}.jpg',
                tilingScheme: new Cesium.GeographicTilingScheme(),
                minimumLevel: 0,
                maximumLevel: 2,
                credit: 'Natural Earth II: Tileset Copyright © 2012-2014 Analytical Graphics, Inc. (AGI). Original data courtesy Natural Earth and in the public domain.'
            };
            baseLayerImageryProvider = new Cesium.UrlTemplateImageryProvider(imageryProviderOptions);
        } else {
            baseLayerImageryProvider = new Cesium.BingMapsImageryProvider({
                url: 'http://dev.virtualearth.net'
            });
        }

        const cesiumViewerOptions = {
            animation: false,
            baseLayerPicker: false,
            selectionIndicator: true,
            fullscreenButton: false,
            geocoder: false,
            homeButton: false,
            infoBox: false,
            sceneModePicker: false,
            timeline: false,
            navigationHelpButton: false,
            creditContainer: 'creditContainer',
            imageryProvider: baseLayerImageryProvider,
            navigationInstructionsInitiallyVisible: false,
            automaticallyTrackDataSourceClocks: false,
        };

        // Create the Cesium Viewer
        let viewer = new Cesium.Viewer(container, cesiumViewerOptions);

        // Add the initial points
        const pins = this.props.pins || [];
        pins.forEach((pin) => {
            //noinspection JSFileReferences
            let billboard = {
                image: pin.image,
                width: 30,
                height: 30
            };
            viewer.entities.add(new Cesium.Entity({
                id: pin.id,
                show: pin.visible,
                position: new Cesium.Cartesian3.fromDegrees(pin.longitude, pin.latitude),
                billboard: billboard
            }));
        });

        return viewer;
    }

    permanentObjectMounted(permanentObject: CesiumViewer): void {
        this.updateGlobeLayers(this.lastLayers || [], this.props.layers || []);
    }

    permanentObjectUnmounted(permanentObject: CesiumViewer): void {
        this.lastLayers = this.props.layers;
    }

    componentWillReceiveProps(nextProps: ICesiumGlobeProps) {
        this.updateGlobeLayers(this.props.layers || [], nextProps.layers || []);
    }

    private updateGlobeLayers(currentLayers: LayerDescriptor[], nextLayers: LayerDescriptor[]) {
        const actions = getLayerDiff<LayerDescriptor>(currentLayers, nextLayers);
        let imageryLayer: ImageryLayer;
        let newLayer: LayerDescriptor;
        let oldLayer: LayerDescriptor;
        for (let action of actions) {
            if (this.props.debug) {
                console.log('CesiumGlobe: next layer action', action);
            }
            // cesiumIndex is +1 because of its base layer at cesiumIndex=0
            const cesiumIndex = action.index + 1;
            switch (action.type) {
                case 'ADD':
                    imageryLayer = this.addLayer(action.newLayer, cesiumIndex);
                    CesiumGlobe.setLayerProps(imageryLayer, action.newLayer);
                    break;
                case 'REMOVE':
                    imageryLayer = this.viewer.imageryLayers.get(cesiumIndex);
                    this.removeLayer(imageryLayer, cesiumIndex);
                    break;
                case 'UPDATE':
                    imageryLayer = this.viewer.imageryLayers.get(cesiumIndex);
                    oldLayer = action.oldLayer;
                    newLayer = action.newLayer;
                    if (oldLayer.imageryProviderOptions.url !== newLayer.imageryProviderOptions.url) {
                        // It is a pitty that Cesium API does not allow for chaning the
                        // URL in place. The current approach, namely remove/add, causes flickering.
                        this.removeLayer(imageryLayer, cesiumIndex);
                        imageryLayer = this.addLayer(newLayer, cesiumIndex);
                    }
                    // update imageryLayer
                    CesiumGlobe.setLayerProps(imageryLayer, newLayer);
                    break;
                case 'MOVE_DOWN':
                    imageryLayer = this.viewer.imageryLayers.get(cesiumIndex);
                    for (let i = 0; i < action.numSteps; i++) {
                        this.viewer.imageryLayers.lower(imageryLayer);
                    }
                    break;
                default:
                    console.error(`CesiumGlobe: unhandled layer action type "${action.type}"`);
            }
        }
    }

    private static getLayerSource(layerDescriptor: LayerDescriptor) {
        if (typeof layerDescriptor.imageryProvider === 'function') {
            return layerDescriptor.imageryProvider(layerDescriptor.imageryProviderOptions);
        } else {
            return layerDescriptor.imageryProvider;
        }
    }

    private addLayer(imageLayer: LayerDescriptor, layerIndex: number): ImageryLayer {
        const imageryProvider = CesiumGlobe.getLayerSource(imageLayer);
        const imageryLayer = this.viewer.imageryLayers.addImageryProvider(imageryProvider, layerIndex);
        if (this.props.debug) {
            console.log(`CesiumGlobe: added imagery layer #${layerIndex}: ${imageLayer.name}`);
        }
        return imageryLayer;
    }

    private removeLayer(imageryLayer: ImageryLayer, layerIndex: number): void {
        this.viewer.imageryLayers.remove(imageryLayer, true);
        if (this.props.debug) {
            console.log(`CesiumGlobe: removed imagery layer #${layerIndex}`);
        }
    }

    private static setLayerProps(imageryLayer: ImageryLayer, layerDescriptor: LayerDescriptor) {
        imageryLayer.name = layerDescriptor.name;
        imageryLayer.show = layerDescriptor.visible;
        imageryLayer.alpha = layerDescriptor.opacity;
        imageryLayer.brightness = layerDescriptor.brightness;
        imageryLayer.contrast = layerDescriptor.contrast;
        imageryLayer.hue = layerDescriptor.hue;
        imageryLayer.saturation = layerDescriptor.saturation;
        imageryLayer.gamma = layerDescriptor.gamma;
    }

    private createContainer(): HTMLElement {
        const div = document.createElement("div");
        div.setAttribute("id", "cesium-container-" + this.props.id);
        div.setAttribute("class", "cesium-container");
        return div;
    }

}
