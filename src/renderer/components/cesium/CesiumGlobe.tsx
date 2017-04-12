import * as React from 'react';
import {IExternalObjectComponentProps, ExternalObjectComponent, ExternalObjectRef} from '../ExternalObjectComponent'
import {getLayerDiff} from "../../../common/layer-diff";
import * as assert from "../../../common/assert";


// console.log(Cesium);
const Cesium: any = require('cesium');
const BuildModuleUrl: any = Cesium.buildModuleUrl;
BuildModuleUrl.setBaseUrl('./');

////////////////////////////////////////////////////////////////////////////////////////////////
// As long as we don't have a @types/Cesium dependency, we provide Cesium dummy types here:
//
// << begin @types/Cesium

export type ImageryProvider = any;
export type ImageryLayer = any;
export type ImageryLayerCollection = {
    readonly length: number;
    addImageryProvider: (provider: ImageryProvider, index: number) => ImageryLayer;
    get: (index: number) => ImageryLayer;
    indexOf: (layer: ImageryLayer) => number;
    remove: (layer: ImageryLayer, destroy?: boolean) => void;
    raise: (layer: ImageryLayer) => void;
    lower: (layer: ImageryLayer) => void;
};

export interface Entity {
}

export interface EntityCollection {
    readonly id: string;
    values: Entity[];
    add(entity: Entity): Entity;
    remove(entity: Entity): boolean;
    removeAll(): void;
    suspendEvents(): void;
    resumeEvents(): void;
}

export interface DataSource {
    name: string;
    show: boolean;
    entities: EntityCollection;
    update(time: any): void;
}

export interface GeoJsonDataSource extends DataSource {
}

export type DataSourceCollection = {
    readonly length: number;
    add: (dataSource: DataSource) => Promise<DataSource>;
    get: (index: number) => DataSource;
    indexOf: (dataSource: DataSource) => number;
    remove: (dataSource: DataSource, destroy?: boolean) => boolean;
};

export type CesiumScene = {
    camera: any;
    globe: any;
    mode: any;
};

export type CesiumViewer = {
    container: HTMLElement;
    entities: any;
    imageryLayers: ImageryLayerCollection;
    dataSources: DataSourceCollection;
    scene: CesiumScene;
    camera: any;
};

// >> end @types/Cesium
////////////////////////////////////////////////////////////////////////////////////////////////


/**
 * Describes a "pin" to be displayed on the Cesium globe.
 */
export interface PinDescriptor {
    id: string;
    name?: string | null;
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
    name?: string | null;
    visible: boolean;
    opacity?: number;
    brightness?: number;
    contrast?: number;
    hue?: number;
    saturation?: number;
    gamma?: number;

    imageryProvider: (options: any) => ImageryProvider | ImageryProvider;
    imageryProviderOptions: any;
}

/**
 * Describes a entity data source to be displayed on the Cesium globe.
 */
export interface DataSourceDescriptor {
    id: string;
    name?: string | null;
    visible: boolean;

    dataSource?: (options: any) => ImageryProvider | ImageryProvider;
    dataSourceOptions?: any;
}

// Bing Maps Key associated with Account Id 1441410 (= norman.fomferra@brockmann-consult.de)
// * Application Name: CCI Toolbox
// * Key / Application Type: Basic / Dev/Test
// * Application URL: http://cci.esa.int/
//
Cesium.BingMapsApi.defaultKey = 'AnCcpOxnAAgq-KyFcczSZYZ_iFvCOmWl0Mx-6QzQ_rzMtpgxZrPZZNxa8_9ZNXci';

interface CesiumGlobeState {
    pins?: PinDescriptor[];
    layers?: LayerDescriptor[];
    dataSources?: DataSourceDescriptor[];
}

export interface ICesiumGlobeProps extends IExternalObjectComponentProps<CesiumViewer, CesiumGlobeState>, CesiumGlobeState {
    offlineMode?: boolean;
    dataSources?: DataSourceDescriptor[];
    onViewerMounted?: (id: string, viewer: CesiumViewer) => void;
    onViewerUnmounted?: (id: string, viewer: CesiumViewer) => void;
}

const CENTRAL_EUROPE_BOX = Cesium.Rectangle.fromDegrees(-30, 20, 40, 80);
const EMPTY_ARRAY = [];
Cesium.Camera.DEFAULT_VIEW_RECTANGLE = CENTRAL_EUROPE_BOX;
Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;

/**
 * A component that wraps a Cesium 3D Globe.
 *
 * @author Norman Fomferra
 */
export class CesiumGlobe extends ExternalObjectComponent<CesiumViewer, CesiumGlobeState, ICesiumGlobeProps, null> {

    constructor(props: ICesiumGlobeProps) {
        super(props);
    }

    newExternalObject(): ExternalObjectRef<CesiumViewer, CesiumGlobeState> {
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
        const viewer = new Cesium.Viewer(container, cesiumViewerOptions);

        // // Add the initial points
        // const pins = this.props.pins || EMPTY_ARRAY;
        // pins.forEach((pin) => {
        //     //noinspection JSFileReferences
        //     let billboard = {
        //         image: pin.image,
        //         width: 30,
        //         height: 30
        //     };
        //     viewer.entities.add(new Cesium.Entity({
        //         id: pin.id,
        //         show: pin.visible,
        //         position: new Cesium.Cartesian3.fromDegrees(pin.longitude, pin.latitude),
        //         billboard: billboard
        //     }));
        // });

        return {object: viewer, container};
    }

    propsToExternalObjectState(props: ICesiumGlobeProps&CesiumGlobeState): CesiumGlobeState {
        const layers = this.props.layers || EMPTY_ARRAY;
        const dataSources = this.props.dataSources || EMPTY_ARRAY;
        return {
            layers,
            dataSources
        };
    }

    updateExternalObject(viewer: CesiumViewer, parentContainer: HTMLElement, prevState: CesiumGlobeState, nextState: CesiumGlobeState) {
        if (this.props.debug) {
            console.log('CesiumGlobe: check to update layers and data sources: ', prevState, nextState);
        }
        const prevLayers = (prevState && prevState.layers) || EMPTY_ARRAY;
        const prevDataSources = (prevState && prevState.dataSources) || EMPTY_ARRAY;

        const nextLayers = nextState.layers || EMPTY_ARRAY;
        const nextDataSources = nextState.dataSources || EMPTY_ARRAY;

        if (prevLayers !== nextLayers) {
            this.updateGlobeLayers(viewer, prevLayers, nextLayers);
        }
        if (prevDataSources !== nextDataSources) {
            this.updateGlobeDataSources(viewer, prevDataSources, nextDataSources);
        }
    }

    externalObjectMounted(viewer: CesiumViewer): void {
        //getViewerPosition(viewer);
        if (this.props.onViewerMounted) {
            this.props.onViewerMounted(this.props.id, viewer);
        }
    }

    externalObjectUnmounted(viewer: CesiumViewer): void {
        //getViewerPosition(viewer);
        if (this.props.onViewerUnmounted) {
            this.props.onViewerUnmounted(this.props.id, viewer);
        }
    }

    private updateGlobeLayers(viewer: CesiumViewer, currentLayers: LayerDescriptor[], nextLayers: LayerDescriptor[]) {
        if (this.props.debug) {
            console.log('CesiumGlobe: updating layers');
        }
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
                    imageryLayer = this.addLayer(viewer, action.newLayer, cesiumIndex);
                    // TODO (forman): FIXME! Keep assertion here and below, but they currently fail.
                    //                Possible reason, new globe views may not have their
                    //                'selectedVariable' layer correctly initialized. Same problem in OpenLayersMap!
                    //assert.ok(imageryLayer);
                    if (!imageryLayer) {
                        console.error('CesiumGlobe: no imageryLayer at index ' + cesiumIndex);
                        break;
                    }
                    CesiumGlobe.setLayerProps(imageryLayer, action.newLayer);
                    break;
                case 'REMOVE':
                    imageryLayer = viewer.imageryLayers.get(cesiumIndex);
                    //assert.ok(imageryLayer);
                    if (!imageryLayer) {
                        console.error('CesiumGlobe: no imageryLayer at index ' + cesiumIndex);
                        break;
                    }
                    this.removeLayer(viewer, imageryLayer, cesiumIndex);
                    break;
                case 'UPDATE':
                    imageryLayer = viewer.imageryLayers.get(cesiumIndex);
                    //assert.ok(imageryLayer);
                    if (!imageryLayer) {
                        console.error('CesiumGlobe: no imageryLayer at index ' + cesiumIndex);
                        break;
                    }
                    oldLayer = action.oldLayer;
                    newLayer = action.newLayer;
                    if (oldLayer.imageryProviderOptions.url !== newLayer.imageryProviderOptions.url) {
                        // It is a pitty that Cesium API does not allow for changing the
                        // URL in place. The current approach, namely remove/add, causes flickering.
                        this.removeLayer(viewer, imageryLayer, cesiumIndex);
                        imageryLayer = this.addLayer(viewer, newLayer, cesiumIndex);
                    }
                    // update imageryLayer
                    CesiumGlobe.setLayerProps(imageryLayer, newLayer);
                    break;
                case 'MOVE_DOWN':
                    imageryLayer = viewer.imageryLayers.get(cesiumIndex);
                    //assert.ok(imageryLayer);
                    if (!imageryLayer) {
                        console.error('CesiumGlobe: no imageryLayer at index ' + cesiumIndex);
                        break;
                    }
                    for (let i = 0; i < action.numSteps; i++) {
                        viewer.imageryLayers.lower(imageryLayer);
                    }
                    break;
                default:
                    console.error(`CesiumGlobe: unhandled layer action type "${action.type}"`);
            }
        }
    }

    private updateGlobeDataSources(viewer: CesiumViewer, currentLayers: DataSourceDescriptor[], nextLayers: DataSourceDescriptor[]) {
        const actions = getLayerDiff<DataSourceDescriptor>(currentLayers, nextLayers);
        let dataSource: DataSource;
        let newLayer: DataSourceDescriptor;
        let oldLayer: DataSourceDescriptor;
        for (let action of actions) {
            if (this.props.debug) {
                console.log('CesiumGlobe: next data source action', action);
            }
            const index = action.index;
            switch (action.type) {
                case 'ADD':
                    dataSource = this.addDataSource(viewer, action.newLayer, index);
                    assert.ok(dataSource);
                    CesiumGlobe.setDataSourceProps(dataSource, action.newLayer);
                    break;
                case 'REMOVE':
                    dataSource = viewer.dataSources.get(index);
                    assert.ok(dataSource);
                    viewer.dataSources.remove(dataSource, true);
                    break;
                case 'UPDATE':
                    dataSource = viewer.dataSources.get(index);
                    assert.ok(dataSource);
                    oldLayer = action.oldLayer;
                    newLayer = action.newLayer;
                    if (oldLayer.dataSourceOptions.url !== newLayer.dataSourceOptions.url) {
                        // It is a pitty that Cesium API does not allow for changing the
                        // URL in place. The current approach, namely remove/add, causes flickering.
                        viewer.dataSources.remove(dataSource, true);
                        dataSource = this.addDataSource(viewer, newLayer, index);
                    }
                    // update imageryLayer
                    CesiumGlobe.setDataSourceProps(dataSource, newLayer);
                    break;
                case 'MOVE_DOWN': {
                    dataSource = viewer.dataSources.get(index);
                    assert.ok(dataSource);
                    this.insertDataSource(viewer, dataSource, index - action.numSteps);
                    break;
                }
                default:
                    console.error(`CesiumGlobe: unhandled layer action type "${action.type}"`);
            }
        }
    }

    private static getImageryProvider(layerDescriptor: LayerDescriptor): ImageryProvider {
        if (layerDescriptor.imageryProvider) {
            if (typeof layerDescriptor.imageryProvider === 'function') {
                return layerDescriptor.imageryProvider(layerDescriptor.imageryProviderOptions);
            } else {
                return layerDescriptor.imageryProvider;
            }
        }
        return null;
    }

    // https://cesiumjs.org/Cesium/Build/Documentation/GeoJsonDataSource.html
    private static getDataSource(dataSourceDescriptor: DataSourceDescriptor): DataSource {
        if (dataSourceDescriptor.dataSource) {
            if (typeof dataSourceDescriptor.dataSource === 'function') {
                return dataSourceDescriptor.dataSource(dataSourceDescriptor.dataSourceOptions);
            } else {
                return dataSourceDescriptor.dataSource;
            }
        }
        return null;
    }

    private addDataSource(viewer: CesiumViewer, layerDescriptor: DataSourceDescriptor, layerIndex: number): ImageryLayer {
        const dataSource = CesiumGlobe.getDataSource(layerDescriptor);
        this.insertDataSource(viewer, dataSource, layerIndex);
        if (this.props.debug) {
            console.log(`CesiumGlobe: added data source #${layerIndex}: ${layerDescriptor.name}`);
        }
        return dataSource;
    }

    private insertDataSource(viewer: CesiumViewer, dataSource: DataSource, index: number) {
        const dataSources: DataSource[] = [];
        // Save all data sources from index to end in dataSources
        for (let i = index; i < viewer.dataSources.length; i++) {
            dataSources.push(viewer.dataSources.get(i));
        }
        // Remove them from viewer
        dataSources.forEach(ds => {
            viewer.dataSources.remove(ds, false);
        });
        // Add the new one (at index)
        viewer.dataSources.add(dataSource);
        // Add the removed ones
        dataSources.forEach(ds => {
            if (ds !== dataSource) {
                viewer.dataSources.add(ds);
            }
        });
    }

    private addLayer(viewer: CesiumViewer, layerDescriptor: LayerDescriptor, layerIndex: number): ImageryLayer {
        const imageryProvider = CesiumGlobe.getImageryProvider(layerDescriptor);
        const imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider, layerIndex);
        if (this.props.debug) {
            console.log(`CesiumGlobe: added imagery layer #${layerIndex}: ${layerDescriptor.name}`);
        }
        return imageryLayer;
    }

    private removeLayer(viewer: CesiumViewer, imageryLayer: ImageryLayer, layerIndex: number): void {
        viewer.imageryLayers.remove(imageryLayer, true);
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

    private static setDataSourceProps(dataSource: DataSource
        | Promise<DataSource>, dataSourceDescriptor: DataSourceDescriptor) {
        Promise.resolve(dataSource).then((resolvedDataSource: DataSource) => {
            //resolvedDataSource.name = dataSourceDescriptor.name;
            resolvedDataSource.show = dataSourceDescriptor.visible;
        });
    }

    private createContainer(): HTMLElement {
        const div = document.createElement("div");
        div.setAttribute("id", "cesium-container-" + this.props.id);
        div.setAttribute("class", "cesium-container");
        return div;
    }

}

function getViewerPosition(viewer: CesiumViewer) {
    let coord;
    let windowPosition = new Cesium.Cartesian2(viewer.container.clientWidth / 2, viewer.container.clientHeight / 2);
    if (windowPosition) {
        try {
            let pickPosition = viewer.camera.pickEllipsoid(windowPosition);
            if (pickPosition) {
                let pickPositionCartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(pickPosition);
                coord = [
                    pickPositionCartographic.longitude * (180 / Math.PI),
                    pickPositionCartographic.latitude * (180 / Math.PI)
                ];
            }
        } catch (e) {
            // console.error('getViewerPosition: e =', e);
        }
    }
    console.log('getViewerPosition: coord =', coord);
    return coord;
}
