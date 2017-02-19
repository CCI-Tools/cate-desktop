import * as React from 'react';
import {IPermanentComponentProps, PermanentComponent} from '../PermanentComponent'
import {getLayerDiff} from "../Layer";

const Cesium: any = require('cesium');
// console.log(Cesium);
const BuildModuleUrl: any = Cesium.buildModuleUrl;
BuildModuleUrl.setBaseUrl('./');

/**
 * As long as we don't have a @types/Cesium dependnency, we provide Cesium dummy types here:
 * - ImageryProvider
 * - CesiumViewer
 */
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

export type  CesiumViewer = {
    container: HTMLElement;
    entities: any;
    imageryLayers: ImageryLayerCollection;
};


/**
 * Describes a "pin" to be displayed on the Cesium globe.
 */
export interface PinDescriptor {
    id: string;
    name: string;
    show: boolean;
    image: string;
    state: string;
    latitude: number;
    longitude: number;
}

export interface ImageEnhancement {
    /**
     * The alpha blending value of this layer, from 0.0 to 1.0.
     */
    alpha: number;

    /**
     * The brightness of this layer. 1.0 uses the unmodified imagery color.
     * Less than 1.0 makes the imagery darker while greater than 1.0 makes it brighter.
     */
    brightness: number;

    /**
     * The contrast of this layer. 1.0 uses the unmodified imagery color.
     * Less than 1.0 reduces the contrast while greater than 1.0 increases it.
     */
    contrast: number;

    /**
     * The hue of this layer. 0.0 uses the unmodified imagery color.
     */
    hue: number;

    /**
     * The saturation of this layer. 1.0 uses the unmodified imagery color.
     * Less than 1.0 reduces the saturation while greater than 1.0 increases it.
     */
    saturation: number;

    /**
     * The gamma correction to apply to this layer. 1.0 uses the unmodified imagery color.
     */
    gamma: number;
}

/**
 * Describes an image layer to be displayed on the Cesium globe.
 */
export interface ImageLayerDescriptor {
    id: string;
    name: string;
    show: boolean;
    imageryProvider: (options: any) => ImageryProvider | ImageryProvider;
    imageryProviderOptions?: any;
    imageEnhancement?: ImageEnhancement;
}

// Bing Maps Key associated with Account Id 1441410 (= norman.fomferra@brockmann-consult.de)
// * Application Name: CCI Toolbox
// * Key / Application Type: Basic / Dev/Test
// * Application URL: http://cci.esa.int/
//
Cesium.BingMapsApi.defaultKey = 'AnCcpOxnAAgq-KyFcczSZYZ_iFvCOmWl0Mx-6QzQ_rzMtpgxZrPZZNxa8_9ZNXci';


export interface ICesiumGlobeProps extends IPermanentComponentProps {
    id: string;
    offlineMode?: boolean;
    pins?: PinDescriptor[];
    imageLayers?: ImageLayerDescriptor[];
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

    constructor(props: ICesiumGlobeProps) {
        super(props);
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
                show: pin.show,
                position: new Cesium.Cartesian3.fromDegrees(pin.longitude, pin.latitude),
                billboard: billboard
            }));
        });

        return viewer;
    }

    componentWillReceiveProps(nextProps: ICesiumGlobeProps) {
        const currentLayers = this.props.imageLayers || [];
        const nextLayers = nextProps.imageLayers || [];

        const actions = getLayerDiff<ImageLayerDescriptor>(currentLayers, nextLayers);
        let imageryLayer: ImageryLayer;
        let newLayer: ImageLayerDescriptor;
        let oldLayer: ImageLayerDescriptor;
        for (let action of actions) {
            // cesiumIndex is +1 because of its base layer at cesiumIndex=0
            const cesiumIndex = action.index + 1;
            switch (action.type) {
                case 'ADD':
                    this.addImageryLayer(action.newLayer, cesiumIndex);
                    break;
                case 'REMOVE':
                    imageryLayer = this.viewer.imageryLayers.get(cesiumIndex);
                    this.removeImageryLayer(imageryLayer, cesiumIndex);
                    break;
                case 'UPDATE':
                    imageryLayer = this.viewer.imageryLayers.get(cesiumIndex);
                    oldLayer = action.oldLayer;
                    newLayer = action.newLayer;
                    if (oldLayer.imageryProviderOptions.url !== newLayer.imageryProviderOptions.url) {
                        // It is a pitty that Cesium API does not allow for chaning the
                        // URL in place. The current approach, namely remove/add, causes flickering.
                        this.removeImageryLayer(imageryLayer, cesiumIndex);
                        imageryLayer = this.addImageryLayer(newLayer, cesiumIndex);
                    }
                    // update imageryLayer
                    imageryLayer.name = newLayer.name;
                    imageryLayer.show = newLayer.show;
                    imageryLayer.alpha = newLayer.imageEnhancement.alpha;
                    imageryLayer.brightness = newLayer.imageEnhancement.brightness;
                    imageryLayer.contrast = newLayer.imageEnhancement.contrast;
                    imageryLayer.hue = newLayer.imageEnhancement.hue;
                    imageryLayer.saturation = newLayer.imageEnhancement.saturation;
                    imageryLayer.gamma = newLayer.imageEnhancement.gamma;
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

    private static getImageryProvider(layer: ImageLayerDescriptor) {
        if (typeof layer.imageryProvider === 'function') {
            return layer.imageryProvider(layer.imageryProvider(layer.imageryProviderOptions));
        } else {
            return layer.imageryProvider;
        }
    }

    private addImageryLayer(imageLayer: ImageLayerDescriptor, layerIndex: number): ImageryLayer {
        const imageryProvider = CesiumGlobe.getImageryProvider(imageLayer);
        const imageryLayer = this.viewer.imageryLayers.addImageryProvider(imageryProvider, layerIndex);
        console.log(`CesiumGlobe: added imagery layer #${layerIndex}: ${imageLayer.name}`);
        return imageryLayer;
    }

    private removeImageryLayer(imageryLayer: ImageryLayer, layerIndex: number): void {
        this.viewer.imageryLayers.remove(imageryLayer, true);
        console.log(`CesiumGlobe: removed imagery layer #${layerIndex}`);
    }

    private createContainer(): HTMLElement {
        const div = document.createElement("div");
        div.setAttribute("id", "cesium-container-" + this.props.id);
        div.setAttribute("class", "cesium-container");
        return div;
    }

}
