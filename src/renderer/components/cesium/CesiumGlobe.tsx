import * as React from 'react';
import {IPermanentComponentProps, PermanentComponent} from '../PermanentComponent'

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
};

export type  CesiumViewer = {
    container: HTMLElement;
    entities: any;
    imageryLayers: ImageryLayerCollection;
};


/**
 * Interface describing the ImageryLayer
 */
export interface CesiumPin {
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

export interface CesiumImageLayer {
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
    pins?: Array<CesiumPin>;
    imageLayers?: Array<CesiumImageLayer>;
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
            console.log('imageryProviderOptions: ', imageryProviderOptions);
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

    private createContainer(): HTMLElement {
        const div = document.createElement("div");
        div.setAttribute("id", "cesium-container-" + this.props.id);
        div.setAttribute("class", "cesium-container");
        return div;
    }

    private static getImageryProvider(layer: CesiumImageLayer) {
        if (typeof layer.imageryProvider === 'function') {
            return layer.imageryProvider(layer.imageryProvider(layer.imageryProviderOptions));
        } else {
            return layer.imageryProvider;
        }
    }

    componentWillReceiveProps(nextProps: ICesiumGlobeProps) {
        const currentLayers = this.props.imageLayers || [];
        const nextLayers = nextProps.imageLayers || [];

        // remove layers of currentLayers which are not in nextLayers
        // also, remember layers from Cesium
        const currentImageLayers = new Map();
        const cesiumImageryLayers = new Map();
        const nextLayerIdSet = new Set<string>(nextLayers.map(l => l.id));
        for (let i = 0; i < currentLayers.length; i++) {
            const currentLayer = currentLayers[i];
            const imageryLayer = this.viewer.imageryLayers.get(i + 1); // +1 because of baseLayer, which is always available
            // assert !!imageryLayer
            if (!imageryLayer) {
                throw Error('!imageryLayer');
            }
            if (!nextLayerIdSet.has(currentLayer.id)) {
                console.log(`Destroying imagery layer #${i + 1}: ${imageryLayer.name}`);
                this.viewer.imageryLayers.remove(imageryLayer, true);
            } else {
                cesiumImageryLayers.set(currentLayer.id, imageryLayer);
                currentImageLayers.set(currentLayer.id, currentLayer);
            }
        }

        // add layers of nextLayers which are not currentLayers or
        // change layers of nextLayers which are in currentLayers
        for (let i = 0; i < nextLayers.length; i++) {
            const nextLayer = nextLayers[i];
            let imageryLayer;
            if (currentImageLayers.has(nextLayer.id)) {
                // change or exchange nextLayer
                const currentLayer = currentImageLayers.get(nextLayer.id);
                // todo: perform a shallow comparison between imageryProviderOptions of nextLayer and currentLayer
                if (nextLayer.imageryProviderOptions.url !== currentLayer.imageryProviderOptions.url) {
                    // remove oldImageryLayer
                    const oldImageryLayer = cesiumImageryLayers.get(nextLayer.id);
                    this.viewer.imageryLayers.remove(oldImageryLayer, true);

                    // add nextLayer
                    const imageryProvider = CesiumGlobe.getImageryProvider(nextLayer);
                    imageryLayer = this.viewer.imageryLayers.addImageryProvider(imageryProvider, i + 1); // +1 because of baseLayer, which is always available
                } else {
                    imageryLayer = cesiumImageryLayers.get(nextLayer.id);
                }
            } else {
                // add nextLayer
                const imageryProvider = CesiumGlobe.getImageryProvider(nextLayer);
                imageryLayer = this.viewer.imageryLayers.addImageryProvider(imageryProvider, i + 1); // +1 because of baseLayer, which is always available
            }

            // todo: bring layers into desired order

            // update imageryLayer
            imageryLayer.name = nextLayer.name;
            imageryLayer.show = nextLayer.show;
            imageryLayer.alpha = nextLayer.imageEnhancement.alpha;
            imageryLayer.brightness = nextLayer.imageEnhancement.brightness;
            imageryLayer.contrast = nextLayer.imageEnhancement.contrast;
            imageryLayer.hue = nextLayer.imageEnhancement.hue;
            imageryLayer.saturation = nextLayer.imageEnhancement.saturation;
            imageryLayer.gamma = nextLayer.imageEnhancement.gamma;
        }
    }
}
