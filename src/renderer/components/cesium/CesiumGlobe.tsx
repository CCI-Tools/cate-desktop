import * as React from 'react';
import {IExternalObjectComponentProps, ExternalObjectComponent} from '../ExternalObjectComponent'
import {arrayDiff} from "../../../common/array-diff";
import * as assert from "../../../common/assert";
import {Feature, Point} from "geojson";

interface Placemark extends Feature<Point> {
    id: string;
}

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
    id?: string;
    name?: string;
    description?: string;
    show?: boolean;
    position?: Cartesian3;
    billboard?: any;
}

export interface EntityCollection {
    readonly id: string;
    values: Entity[];
    show: boolean;
    getById(id: string): Entity;
    add(entity: Entity): Entity;
    remove(entity: Entity): boolean;
    removeById(entity: Entity): boolean;
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

export type Scene = {
    camera: any;
    globe: any;
    mode: any;
};

export type Viewer = {
    container: HTMLElement;
    canvas:HTMLCanvasElement
    entities: EntityCollection;
    imageryLayers: ImageryLayerCollection;
    dataSources: DataSourceCollection;
    scene: Scene;
    camera: any;
    selectedEntity : Entity | null;
    selectedEntityChanged: any;
    forceResize();
};

export type Cartesian2 = {
    x: number;
    y: number;
};

export type Cartesian3 = {
    x: number;
    y: number;
    z: number;
};

export type Cartographic = {
    longitude: number;
    latitude: number;
    height?: number;
};

// >> end @types/Cesium
////////////////////////////////////////////////////////////////////////////////////////////////

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
    selectedPlacemarkId?: string;
    placemarks?: Placemark[];
    layers?: LayerDescriptor[];
    dataSources?: DataSourceDescriptor[];
}

export interface ICesiumGlobeProps extends IExternalObjectComponentProps<Viewer, CesiumGlobeState>, CesiumGlobeState {
    offlineMode?: boolean;
    dataSources?: DataSourceDescriptor[];
    onMouseClicked?: (point: {latitude: number, longitude: number, height?: number}) => void;
    onMouseMoved?: (point: {latitude: number, longitude: number, height?: number}) => void;
    onLeftUp?: (point: {latitude: number, longitude: number, height?: number}) => void;
    onPlacemarkSelected?: (placemarkId: string | null) => void;
    onViewerMounted?: (id: string, viewer: Viewer) => void;
    onViewerUnmounted?: (id: string, viewer: Viewer) => void;

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
export class CesiumGlobe extends ExternalObjectComponent<Viewer, CesiumGlobeState, ICesiumGlobeProps, null> {
    private mouseClickHandler: any;
    private mouseMoveHandler: any;
    private leftUpHandler: any;
    private selectedEntityHandler: any;

    constructor(props: ICesiumGlobeProps) {
        super(props);
    }

    newContainer(id: string): HTMLElement {
        const div = document.createElement("div");
        div.setAttribute("id", "cesium-container-" + id);
        div.setAttribute("style", "width: 100%; height: 100%; overflow: hidden;");
        return div;
    }

    newExternalObject(parentContainer: HTMLElement, container: HTMLElement): Viewer {

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
            sceneModePicker: true,
            timeline: false,
            navigationHelpButton: false,
            creditContainer: 'creditContainer',
            imageryProvider: baseLayerImageryProvider,
            navigationInstructionsInitiallyVisible: false,
            automaticallyTrackDataSourceClocks: false,
        };

        // Create the Cesium Viewer
        //noinspection UnnecessaryLocalVariableJS
        const viewer = new Cesium.Viewer(container, cesiumViewerOptions);

        // knockout is used by Cesium to update the style attributes of the selectionIndicator
        // when using multiple views this breaks, for unknown reason
        // to get this working we update the 'style' attribute of the selectionIndicatorElement manually
        // https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Source/Widgets/SelectionIndicator/SelectionIndicatorViewModel.js
        const viewModel = viewer.selectionIndicator.viewModel;
        const originalUpdate = viewModel.update;
        viewModel.update = function() {
            originalUpdate.apply(this);
            const styleValue = `top : ${viewModel._screenPositionY}; left : ${viewModel._screenPositionX};`;
            viewModel._selectionIndicatorElement.setAttribute('style', styleValue);
        };

        return viewer;
    }

    propsToExternalObjectState(props: ICesiumGlobeProps&CesiumGlobeState): CesiumGlobeState {
        const selectedPlacemarkId = this.props.selectedPlacemarkId;
        const placemarks = this.props.placemarks || EMPTY_ARRAY;
        const layers = this.props.layers || EMPTY_ARRAY;
        const dataSources = this.props.dataSources || EMPTY_ARRAY;
        return {
            selectedPlacemarkId,
            placemarks,
            layers,
            dataSources
        };
    }

    updateExternalObject(viewer: Viewer, prevState: CesiumGlobeState, nextState: CesiumGlobeState): void {

        const prevSelectedPlacemarkId = (prevState && prevState.selectedPlacemarkId) || null;
        const prevPlacemarks = (prevState && prevState.placemarks) || EMPTY_ARRAY;
        const prevLayers = (prevState && prevState.layers) || EMPTY_ARRAY;
        const prevDataSources = (prevState && prevState.dataSources) || EMPTY_ARRAY;

        const nextSelectedPlacemarkId = nextState.selectedPlacemarkId || null;
        const nextPlacemarks = nextState.placemarks || EMPTY_ARRAY;
        const nextLayers = nextState.layers || EMPTY_ARRAY;
        const nextDataSources = nextState.dataSources || EMPTY_ARRAY;

        if (prevPlacemarks !== nextPlacemarks) {
            this.updateGlobePlacemarks(viewer, prevPlacemarks, nextPlacemarks);
        }
        if (prevLayers !== nextLayers) {
            this.updateGlobeLayers(viewer, prevLayers, nextLayers);
        }
        if (prevDataSources !== nextDataSources) {
            this.updateGlobeDataSources(viewer, prevDataSources, nextDataSources);
        }
        if (prevSelectedPlacemarkId !== nextSelectedPlacemarkId) {
            this.updateGlobeSelectedPlacemark(viewer, nextSelectedPlacemarkId);
        }
    }

    externalObjectMounted(viewer: Viewer): void {
        this.mouseClickHandler = new Cesium.ScreenSpaceEventHandler();
        this.mouseClickHandler.setInputAction(
            (event) => {
                const cartographic = screenToCartographic(viewer, event.position, true);
                if (this.props.onMouseClicked) {
                    this.props.onMouseClicked(cartographic);
                }
            },
            Cesium.ScreenSpaceEventType.LEFT_CLICK
        );

        this.mouseMoveHandler = new Cesium.ScreenSpaceEventHandler();
        this.mouseMoveHandler.setInputAction(
            (event) => {
                const point = event.endPosition;
                const cartographic = screenToCartographic(viewer, point, true);
                if (this.props.onMouseMoved) {
                    this.props.onMouseMoved(cartographic);
                }
            },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE
        );

        this.leftUpHandler = new Cesium.ScreenSpaceEventHandler();
        this.leftUpHandler.setInputAction(
            () => {
                let point; // = undefined, good.
                //noinspection JSUnusedAssignment
                const cartographic = screenToCartographic(viewer, point, true);
                if (this.props.onLeftUp) {
                    this.props.onLeftUp(cartographic);
                }
            },
            Cesium.ScreenSpaceEventType.LEFT_UP
        );

        this.selectedEntityHandler = (selectedEntity: Entity) => {
            if (this.props.onPlacemarkSelected) {
                const placemarkId = selectedEntity ? selectedEntity.id : null;
                this.props.onPlacemarkSelected(placemarkId);
            }
        };
        viewer.selectedEntityChanged.addEventListener(this.selectedEntityHandler);

        if (this.props.onViewerMounted) {
            this.props.onViewerMounted(this.props.id, viewer);
        }
    }

    externalObjectUnmounted(viewer: Viewer): void {
        this.mouseClickHandler = this.mouseClickHandler && this.mouseClickHandler.destroy();
        this.mouseClickHandler = null;
        this.mouseMoveHandler = this.mouseMoveHandler && this.mouseMoveHandler.destroy();
        this.mouseMoveHandler = null;
        this.leftUpHandler = this.leftUpHandler && this.leftUpHandler.destroy();
        this.leftUpHandler = null;

        viewer.selectedEntityChanged.removeEventListener(this.selectedEntityHandler);
        this.selectedEntityHandler = null;

        if (this.props.onViewerUnmounted) {
            this.props.onViewerUnmounted(this.props.id, viewer);
        }
    }

    //noinspection JSMethodCanBeStatic
    private updateGlobeSelectedPlacemark(viewer: Viewer, selectedPlacemarkId: string | null) {
        let selectedEntity = (selectedPlacemarkId && viewer.entities.getById(selectedPlacemarkId)) || null;
        if (this.props.debug) {
            console.log('CesiumGlobe: updating selected entity: ', viewer.selectedEntity, selectedEntity);
        }
        if (viewer.selectedEntity === selectedEntity) {
            return;
        }
        viewer.selectedEntity = selectedEntity;
    }

    private updateGlobePlacemarks(viewer: Viewer, currentPlacemarks: Placemark[], nextPlacemarks: Placemark[]) {
        if (this.props.debug) {
            console.log('CesiumGlobe: updating placemarks');
        }
        const pinBuilder = new Cesium.PinBuilder();
        const actions = arrayDiff<Placemark>(currentPlacemarks, nextPlacemarks);
        for (let action of actions) {
            if (this.props.debug) {
                console.log('CesiumGlobe: next placemark action', action);
            }
            switch (action.type) {
                case 'ADD': {
                    const placemark = action.newElement;
                    const id = placemark.id;
                    const show = placemark.properties['visible'];
                    const name = placemark.properties['name'] || '';
                    const positionCoords = placemark.geometry.coordinates;
                    const position = new Cesium.Cartesian3.fromDegrees(positionCoords[0], positionCoords[1]);
                    // see http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Map%20Pins.html&label=All
                    const billboard = {
                        image: pinBuilder.fromText(name && name.length ? name[0].toUpperCase() : '?', Cesium.Color.ROYALBLUE, 32).toDataURL(),
                        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    };
                    viewer.entities.add(new Cesium.Entity({
                        id,
                        name,
                        show,
                        position,
                        billboard,
                    }));
                    break;
                }
                case 'REMOVE': {
                    let placemark = action.oldElement;
                    viewer.entities.removeById(placemark.id);
                    break;
                }
                case 'UPDATE':
                    let oldPlacemark = action.oldElement;
                    let newPlacemark = action.newElement;
                    let change = action.change;
                    let entity = viewer.entities.getById(oldPlacemark.id);
                    if (entity) {
                        if (this.props.debug) {
                            console.log('Entity change: ', change, oldPlacemark, newPlacemark);
                        }
                        const show = newPlacemark.properties['visible'];
                        const name = newPlacemark.properties['name'] || '';
                        const positionCoords = newPlacemark.geometry.coordinates;
                        const position = new Cesium.Cartesian3.fromDegrees(positionCoords[0], positionCoords[1]);
                        const billboard = {
                            image: pinBuilder.fromText(name && name.length ? name[0].toUpperCase() : '?', Cesium.Color.ROYALBLUE, 32).toDataURL(),
                            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                        };
                        entity.show = show;
                        entity.name = name;
                        entity.position = position;
                        entity.billboard = billboard;
                    }
                    break;
                default:
                    console.error(`CesiumGlobe: unhandled placemark action type "${action.type}"`);
            }
        }
    }

    private updateGlobeLayers(viewer: Viewer, currentLayers: LayerDescriptor[], nextLayers: LayerDescriptor[]) {
        if (this.props.debug) {
            console.log('CesiumGlobe: updating layers');
        }
        const actions = arrayDiff<LayerDescriptor>(currentLayers, nextLayers);
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
                    imageryLayer = this.addLayer(viewer, action.newElement, cesiumIndex);
                    // TODO (forman): FIXME! Keep assertion here and below, but they currently fail.
                    //                Possible reason, new globe views may not have their
                    //                'selectedVariable' layer correctly initialized. Same problem in OpenLayersMap!
                    //assert.ok(imageryLayer);
                    if (!imageryLayer) {
                        console.error('CesiumGlobe: no imageryLayer at index ' + cesiumIndex);
                        break;
                    }
                    CesiumGlobe.setLayerProps(imageryLayer, action.newElement);
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
                    oldLayer = action.oldElement;
                    newLayer = action.newElement;
                    if (oldLayer.imageryProviderOptions.url !== newLayer.imageryProviderOptions.url) {
                        // It is a pitty that Cesium API does not allow for changing the
                        // URL in place. The current approach, namely remove/add, causes flickering.
                        this.removeLayer(viewer, imageryLayer, cesiumIndex);
                        imageryLayer = this.addLayer(viewer, newLayer, cesiumIndex);
                    }
                    // update imageryLayer
                    CesiumGlobe.setLayerProps(imageryLayer, newLayer);
                    break;
                case 'MOVE':
                    imageryLayer = viewer.imageryLayers.get(cesiumIndex);
                    //assert.ok(imageryLayer);
                    if (!imageryLayer) {
                        console.error('CesiumGlobe: no imageryLayer at index ' + cesiumIndex);
                        break;
                    }
                    if (action.numSteps < 0) {
                        for (let i = 0; i < -action.numSteps; i++) {
                            viewer.imageryLayers.lower(imageryLayer);
                        }
                    } else {
                        for (let i = 0; i < action.numSteps; i++) {
                            viewer.imageryLayers.raise(imageryLayer);
                        }
                    }
                    break;
                default:
                    console.error(`CesiumGlobe: unhandled layer action type "${action.type}"`);
            }
        }
    }

    private updateGlobeDataSources(viewer: Viewer, currentLayers: DataSourceDescriptor[], nextLayers: DataSourceDescriptor[]) {
        const actions = arrayDiff<DataSourceDescriptor>(currentLayers, nextLayers);
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
                    dataSource = this.addDataSource(viewer, action.newElement, index);
                    assert.ok(dataSource);
                    CesiumGlobe.setDataSourceProps(dataSource, action.newElement);
                    break;
                case 'REMOVE':
                    dataSource = viewer.dataSources.get(index);
                    assert.ok(dataSource);
                    viewer.dataSources.remove(dataSource, true);
                    break;
                case 'UPDATE':
                    dataSource = viewer.dataSources.get(index);
                    assert.ok(dataSource);
                    oldLayer = action.oldElement;
                    newLayer = action.newElement;
                    if (oldLayer.dataSourceOptions.url !== newLayer.dataSourceOptions.url) {
                        // It is a pitty that Cesium API does not allow for changing the
                        // URL in place. The current approach, namely remove/add, causes flickering.
                        viewer.dataSources.remove(dataSource, true);
                        dataSource = this.addDataSource(viewer, newLayer, index);
                    }
                    // update imageryLayer
                    CesiumGlobe.setDataSourceProps(dataSource, newLayer);
                    break;
                case 'MOVE': {
                    dataSource = viewer.dataSources.get(index);
                    assert.ok(dataSource);
                    this.insertDataSource(viewer, dataSource, index + action.numSteps);
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

    private addDataSource(viewer: Viewer, layerDescriptor: DataSourceDescriptor, layerIndex: number): ImageryLayer {
        const dataSource = CesiumGlobe.getDataSource(layerDescriptor);
        this.insertDataSource(viewer, dataSource, layerIndex);
        if (this.props.debug) {
            console.log(`CesiumGlobe: added data source #${layerIndex}: ${layerDescriptor.name}`);
        }
        return dataSource;
    }

    private insertDataSource(viewer: Viewer, dataSource: DataSource, index: number) {
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

    private addLayer(viewer: Viewer, layerDescriptor: LayerDescriptor, layerIndex: number): ImageryLayer {
        const imageryProvider = CesiumGlobe.getImageryProvider(layerDescriptor);
        const imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider, layerIndex);
        if (this.props.debug) {
            console.log(`CesiumGlobe: added imagery layer #${layerIndex}: ${layerDescriptor.name}`);
        }
        return imageryLayer;
    }

    private removeLayer(viewer: Viewer, imageryLayer: ImageryLayer, layerIndex: number): void {
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

}

function screenToCartographic(viewer: Viewer, screenPoint?: Cartesian2, degrees?: boolean): Cartographic {
    let canvasPoint;
    if (screenPoint) {
        const rect = viewer.canvas.getBoundingClientRect();
        canvasPoint = new Cesium.Cartesian2(screenPoint.x - rect.left, screenPoint.y - rect.top);
    }else {
        canvasPoint = new Cesium.Cartesian2(viewer.canvas.clientWidth / 2, viewer.canvas.clientHeight / 2);
    }
    const ellipsoid = viewer.scene.globe.ellipsoid;
    const cartesian = viewer.camera.pickEllipsoid(canvasPoint, ellipsoid);
    if (cartesian) {
        const cartographic = ellipsoid.cartesianToCartographic(cartesian);
        if (cartographic && degrees) {
            const factor = 10000.;
            const longitude = Math.round(factor * Cesium.Math.toDegrees(cartographic.longitude)) / factor;
            const latitude = Math.round(factor * Cesium.Math.toDegrees(cartographic.latitude)) / factor;
            return {longitude, latitude, height: cartographic.height};
        }
        return cartographic;
    }
}
