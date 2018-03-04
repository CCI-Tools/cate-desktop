import * as React from 'react';
import * as Cesium from "cesium";
import {diff} from "deep-object-diff"
import {Feature, FeatureCollection, Point} from "geojson";
import {IExternalObjectComponentProps, ExternalObjectComponent} from '../ExternalObjectComponent'
import * as assert from "../../../common/assert";
import {isString} from "../../../common/types";
import {arrayDiff} from "../../../common/array-diff";
import {SimpleStyle} from "../../../common/geojson-simple-style";
import {SplitSlider} from "./SplitSlider";
import {
    applyStyleToEntity, applyStyleToEntityCollection, getEntityByEntityId,
    simpleStyleToCesium
} from "./cesium-util";
import {
    BoxTool, CesiumToolContext, GeometryToolType, NO_TOOL, PointTool, PolygonTool,
    PolylineTool
} from "./geometry-tool";

interface Placemark extends Feature<Point> {
    id: string;
}

interface PlacemarkCollection extends FeatureCollection<Point> {
    features: Placemark[];
}

/**
 * Describes a layer to be displayed on the Cesium globe.
 */
export interface LayerDescriptor {
    id: string;
    name?: string | null;
    visible: boolean;
}

/**
 * Describes an image layer (imagery provider) to be displayed on the Cesium globe.
 */
export interface ImageLayerDescriptor extends LayerDescriptor {
    opacity?: number;
    brightness?: number;
    contrast?: number;
    hue?: number;
    saturation?: number;
    gamma?: number;

    imageryProvider: ((viewer: Cesium.Viewer, options: any) => Cesium.ImageryProvider) | Cesium.ImageryProvider;
    imageryProviderOptions: any;
}

/**
 * Describes a vector data layer (entity data source) to be displayed on the Cesium globe.
 */
export interface VectorLayerDescriptor extends LayerDescriptor {
    style?: SimpleStyle;
    entityStyles?: { [layerId: string]: SimpleStyle };
    dataSource?: ((viewer: Cesium.Viewer, options: any) => Cesium.DataSource) | Cesium.DataSource;
    dataSourceOptions?: any;
}

export interface LayerDescriptors {
    vectorLayerDescriptors?: VectorLayerDescriptor[];
    imageLayerDescriptors?: ImageLayerDescriptor[];
}

// Bing Maps Key associated with Account Id 1441410 (= norman.fomferra@brockmann-consult.de)
// * Application Name: CCI Toolbox
// * Key / Application Type: Basic / Dev/Test
// * Application URL: http://cci.esa.int/
//
Cesium.BingMapsApi.defaultKey = 'AnCcpOxnAAgq-KyFcczSZYZ_iFvCOmWl0Mx-6QzQ_rzMtpgxZrPZZNxa8_9ZNXci';


interface CesiumGlobeStateBase {
    selectedPlacemarkId?: string;
    imageLayerDescriptors?: ImageLayerDescriptor[];
    vectorLayerDescriptors?: VectorLayerDescriptor[];
    overlayHtml?: HTMLElement | null;
    splitLayerIndex?: number;
    splitLayerPos?: number;
    geometryToolType?: GeometryToolType;
}

type DataSourceMap = { [layerId: string]: Cesium.DataSource };

interface CesiumGlobeState extends CesiumGlobeStateBase {
    dataSourceMap: DataSourceMap;
}

export interface ICesiumGlobeProps extends IExternalObjectComponentProps<Cesium.Viewer, CesiumGlobeState>, CesiumGlobeStateBase {
    offlineMode?: boolean;
    onMouseClicked?: (point: { latitude: number, longitude: number, height?: number }) => void;
    onMouseMoved?: (point: { latitude: number, longitude: number, height?: number }) => void;
    onLeftUp?: (point: { latitude: number, longitude: number, height?: number }) => void;
    onSelectedEntityChanged?: (selectedEntity: Cesium.Entity | null) => void;
    onViewerMounted?: (id: string, viewer: Cesium.Viewer) => void;
    onViewerUnmounted?: (id: string, viewer: Cesium.Viewer) => void;
    onSplitLayerPosChange?: (splitLayerPos: number) => void;
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
export class CesiumGlobe extends ExternalObjectComponent<Cesium.Viewer, CesiumGlobeState, ICesiumGlobeProps, null> {
    private cesiumEventHandler: any;
    private selectedEntityChangeHandler: any;
    private toolContext: CesiumToolContext;

    constructor(props: ICesiumGlobeProps) {
        super(props);
        this.handleRemoteBaseLayerError = this.handleRemoteBaseLayerError.bind(this);
    }

    get viewer(): Cesium.Viewer | null {
        const externalObjectRef = this.getExternalObjectRef();
        return !!externalObjectRef ? externalObjectRef.object : null;
    }

    protected renderChildren() {
        return (<SplitSlider splitPos={this.props.splitLayerPos}
                             onChange={this.props.onSplitLayerPosChange}
                             visible={this.props.splitLayerIndex >= 0}/>);
    }

    newContainer(id: string): HTMLElement {
        const div = document.createElement("div");
        div.setAttribute("id", "cesium-container-" + id);
        div.setAttribute("style", "width: 100%; height: 100%; overflow: hidden;");
        return div;
    }

    newExternalObject(parentContainer: HTMLElement, container: HTMLElement): Cesium.Viewer {

        let baseLayerImageryProvider;
        if (this.props.offlineMode) {
            baseLayerImageryProvider = CesiumGlobe.getStaticNaturalEarthImageryProvider();
        } else {
            baseLayerImageryProvider = new Cesium.BingMapsImageryProvider({url: 'http://dev.virtualearth.net'});
            baseLayerImageryProvider.errorEvent.addEventListener(this.handleRemoteBaseLayerError);
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
            // Create a viewer that will not render frames based on changes in simulation time.
            // https://cesium.com/blog/2018/01/24/cesium-scene-rendering-performance/
            requestRenderMode : true,
            maximumRenderTimeChange : Infinity
        };

        // Create the CesiumCesium.Viewer
        //noinspection UnnecessaryLocalVariableJS
        const viewer = new Cesium.Viewer(container, cesiumViewerOptions);

        // Uncomment to show a little overlay panel with FPS. Usefull for optimisations.
        //viewer.scene.debugShowFramesPerSecond = true;

        // knockout is used by Cesium to update the style attributes of the selectionIndicator
        // when using multiple views this breaks, for unknown reason
        // to get this working we update the 'style' attribute of the selectionIndicatorElement manually
        // https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Source/Widgets/SelectionIndicator/SelectionIndicatorViewModel.js
        const viewModel = viewer.selectionIndicator.viewModel;
        const originalUpdate = viewModel.update;
        viewModel.update = function () {
            originalUpdate.apply(this);
            const styleValue = `top : ${viewModel._screenPositionY}; left : ${viewModel._screenPositionX};`;
            viewModel._selectionIndicatorElement.setAttribute('style', styleValue);
        };

        return viewer;
    }

    private handleRemoteBaseLayerError(event) {
        console.error('CesiumGlobe: error: ', event.message, event.timesRetried, event.error);
        let ref = this.getExternalObjectRef();
        if (ref) {
            const viewer: Cesium.Viewer = ref.object;
            // On error, exchange the remote base layer with a static one.
            let imageryLayer = viewer.imageryLayers.get(0);
            viewer.imageryLayers.remove(imageryLayer, true);
            let staticNaturalEarthImageryProvider = CesiumGlobe.getStaticNaturalEarthImageryProvider();
            viewer.imageryLayers.addImageryProvider(staticNaturalEarthImageryProvider, 0);
        }
    }

    private static getStaticNaturalEarthImageryProvider() {
        Cesium.buildModuleUrl.setBaseUrl('./');
        const baseUrl = Cesium.buildModuleUrl('');
        const imageryProviderOptions = {
            url: baseUrl + 'Assets/Textures/NaturalEarthII/{z}/{x}/{reverseY}.jpg',
            tilingScheme: new Cesium.GeographicTilingScheme(),
            minimumLevel: 0,
            maximumLevel: 2,
            credit: 'Natural Earth II: Tileset Copyright © 2012-2014 Analytical Graphics, Inc. (AGI). Original data courtesy Natural Earth and in the public domain.'
        };
        return new Cesium.UrlTemplateImageryProvider(imageryProviderOptions);
    }

    propsToExternalObjectState(props: ICesiumGlobeProps & CesiumGlobeState, prevState?: CesiumGlobeState): CesiumGlobeState {
        const selectedPlacemarkId = props.selectedPlacemarkId;
        const imageLayerDescriptors = props.imageLayerDescriptors || EMPTY_ARRAY;
        const vectorLayerDescriptors = props.vectorLayerDescriptors || EMPTY_ARRAY;
        const overlayHtml = props.overlayHtml || null;
        const splitLayerIndex = props.splitLayerIndex;
        const splitLayerPos = props.splitLayerPos;
        const geometryToolType = props.geometryToolType;
        const dataSourceMap = (prevState && prevState.dataSourceMap) || {};
        return {
            selectedPlacemarkId,
            imageLayerDescriptors,
            vectorLayerDescriptors,
            overlayHtml,
            splitLayerIndex,
            splitLayerPos,
            geometryToolType,
            dataSourceMap,
        };
    }

    updateExternalObject(viewer: Cesium.Viewer, prevState: CesiumGlobeState, nextState: CesiumGlobeState): void {

        const prevSelectedPlacemarkId = (prevState && prevState.selectedPlacemarkId) || null;
        const prevImageLayerDescriptors = (prevState && prevState.imageLayerDescriptors) || EMPTY_ARRAY;
        const prevVectorLayerDescriptors = (prevState && prevState.vectorLayerDescriptors) || EMPTY_ARRAY;
        const prevOverlayHtml = (prevState && prevState.overlayHtml) || null;
        const prevSplitLayerIndex = (prevState && prevState.splitLayerIndex);
        const prevSplitLayerPos = (prevState && prevState.splitLayerPos);
        const prevGeometryToolType = (prevState && prevState.geometryToolType) || "NoTool";

        const nextSelectedPlacemarkId = nextState.selectedPlacemarkId || null;
        const nextImageLayerDescriptors = nextState.imageLayerDescriptors || EMPTY_ARRAY;
        const nextVectorLayerDescriptors = nextState.vectorLayerDescriptors || EMPTY_ARRAY;
        const nextOverlayHtml = nextState.overlayHtml;
        const nextSplitLayerIndex = nextState.splitLayerIndex;
        const nextSplitLayerPos = nextState.splitLayerPos;
        const nextGeometryToolType = nextState.geometryToolType || "NoTool";

        let shouldRequestRender = false;

        if (prevImageLayerDescriptors !== nextImageLayerDescriptors) {
            this.updateImageLayers(viewer,
                                   prevImageLayerDescriptors,
                                   nextImageLayerDescriptors);
            shouldRequestRender = true;
        }
        if (prevVectorLayerDescriptors !== nextVectorLayerDescriptors) {
            this.updateVectorLayers(viewer,
                                    prevVectorLayerDescriptors,
                                    nextVectorLayerDescriptors,
                                    nextState.dataSourceMap,
                                    nextSelectedPlacemarkId);
            shouldRequestRender = true;
        }
        if (prevSelectedPlacemarkId !== nextSelectedPlacemarkId) {
            this.updatePlacemarkSelection(viewer, nextSelectedPlacemarkId);
            shouldRequestRender = true;
        }
        if (prevOverlayHtml !== nextOverlayHtml) {
            CesiumGlobe.updateOverlayHtml(viewer, prevOverlayHtml, nextOverlayHtml);
            shouldRequestRender = true;
        }
        if (prevSplitLayerIndex !== nextSplitLayerIndex) {
            CesiumGlobe.updateSplitLayers(viewer, prevSplitLayerIndex, nextSplitLayerIndex);
            shouldRequestRender = true;
        }
        if (prevSplitLayerPos !== nextSplitLayerPos) {
            viewer.scene.imagerySplitPosition = nextSplitLayerPos;
            shouldRequestRender = true;
        }
        if (prevGeometryToolType !== nextGeometryToolType) {
            this.activateGeometryTool(viewer, nextGeometryToolType);
        }

        if (shouldRequestRender) {
            // Explicitly render a new frame
            viewer.scene.requestRender();
        }
    }

    externalObjectMounted(viewer: Cesium.Viewer, props: Readonly<ICesiumGlobeProps>): void {
        this.cesiumEventHandler = new Cesium.ScreenSpaceEventHandler();
        this.cesiumEventHandler.setInputAction(
            (event) => {
                const cartographic = screenToCartographic(viewer, event.position, true);
                if (props.onMouseClicked) {
                    props.onMouseClicked(cartographic);
                }
            },
            Cesium.ScreenSpaceEventType.LEFT_CLICK
        );

        this.cesiumEventHandler.setInputAction(
            (event) => {
                const point = event.endPosition;
                const cartographic = screenToCartographic(viewer, point, true);
                if (props.onMouseMoved) {
                    props.onMouseMoved(cartographic);
                }
            },
            Cesium.ScreenSpaceEventType.MOUSE_MOVE
        );

        this.cesiumEventHandler.setInputAction(
            () => {
                let point; // = undefined, good.
                //noinspection JSUnusedAssignment
                const cartographic = screenToCartographic(viewer, point, true);
                if (props.onLeftUp) {
                    props.onLeftUp(cartographic);
                }
            },
            Cesium.ScreenSpaceEventType.LEFT_UP
        );

        this.selectedEntityChangeHandler = (selectedEntity: Cesium.Entity | null) => {
            if (props.onSelectedEntityChanged) {
                props.onSelectedEntityChanged(selectedEntity);
            }
        };
        viewer.selectedEntityChanged.addEventListener(this.selectedEntityChangeHandler);

        this.toolContext = new CesiumToolContext(viewer);
        this.activateGeometryTool(viewer, props.geometryToolType);

        viewer.scene.requestRender();

        if (props.onViewerMounted) {
            props.onViewerMounted(props.id, viewer);
        }
    }

    externalObjectUnmounted(viewer: Cesium.Viewer, props: Readonly<ICesiumGlobeProps>): void {
        if (this.cesiumEventHandler) {
            this.cesiumEventHandler.destroy();
            this.cesiumEventHandler = null;
        }

        if (this.selectedEntityChangeHandler) {
            viewer.selectedEntityChanged.removeEventListener(this.selectedEntityChangeHandler);
            this.selectedEntityChangeHandler = null;
        }

        if (this.toolContext) {
            this.toolContext.destroy();
            this.toolContext = null;
        }

        if (props.onViewerUnmounted) {
            props.onViewerUnmounted(props.id, viewer);
        }
    }

    //noinspection JSMethodCanBeStatic
    private updatePlacemarkSelection(viewer: Cesium.Viewer, selectedPlacemarkId: string | null) {
        const selectedEntity = (selectedPlacemarkId && getEntityByEntityId(viewer, selectedPlacemarkId)) || null;
        const selectedEntityInViewer = viewer.selectedEntity || null;
        if (this.props.debug) {
            console.log('CesiumGlobe: updating selected placemark: ', selectedEntityInViewer, selectedEntity);
        }
        if (selectedEntityInViewer !== selectedEntity) {
            viewer.selectedEntity = selectedEntity;
        }
    }

    private updatePlacemarks(entities: Cesium.EntityCollection,
                             currentPlacemarks: PlacemarkCollection,
                             nextPlacemarks: PlacemarkCollection,
                             style: SimpleStyle) {
        if (this.props.debug) {
            console.log('CesiumGlobe: updating placemarks');
        }
        const actions = arrayDiff<Placemark>((currentPlacemarks && currentPlacemarks.features) || EMPTY_ARRAY,
            (nextPlacemarks && nextPlacemarks.features) || EMPTY_ARRAY);
        const promises = [];
        for (let action of actions) {
            if (this.props.debug) {
                console.log('CesiumGlobe: next placemark action', action);
            }
            switch (action.type) {
                case 'ADD': {
                    const placemark = action.newElement;
                    const show = placemark.properties['visible'];
                    const promise = Cesium.GeoJsonDataSource.load(placemark, simpleStyleToCesium(style));
                    promises.push(Promise.resolve(promise).then(ds => {
                        CesiumGlobe.copyEntities(ds.entities, entities, show);
                    }));
                    break;
                }
                case 'REMOVE': {
                    let placemark = action.oldElement;
                    entities.removeById(placemark.id);
                    break;
                }
                case 'UPDATE':
                    let oldPlacemark = action.oldElement;
                    let newPlacemark = action.newElement;
                    const show = newPlacemark.properties['visible'];
                    const promise = Cesium.GeoJsonDataSource.load(newPlacemark, simpleStyleToCesium(style));
                    promises.push(Promise.resolve(promise).then(ds => {
                        entities.removeById(oldPlacemark.id);
                        CesiumGlobe.copyEntities(ds.entities, entities, show);
                    }));
                    break;
                default:
                    console.error(`CesiumGlobe: unhandled placemark action type "${action.type}"`);
            }
        }
        return Promise.all(promises);
    }

    private updateImageLayers(viewer: Cesium.Viewer,
                              currentLayers: ImageLayerDescriptor[],
                              nextLayers: ImageLayerDescriptor[]) {
        if (this.props.debug) {
            console.log('CesiumGlobe: updating image layers');
        }
        const actions = arrayDiff<ImageLayerDescriptor>(currentLayers, nextLayers);
        let imageryLayer: Cesium.ImageryLayer;
        let newLayer: ImageLayerDescriptor;
        let oldLayer: ImageLayerDescriptor;
        for (let action of actions) {
            if (this.props.debug) {
                console.log('CesiumGlobe: next image layer action', action);
            }
            // cesiumIndex is +1 because of its base layer at cesiumIndex=0
            const cesiumIndex = action.index + 1;
            switch (action.type) {
                case 'ADD':
                    imageryLayer = this.addLayer(viewer, action.newElement, cesiumIndex);
                    if (!imageryLayer) {
                        // TODO (forman): Check, if we still get here.
                        //                Possible reason, new globe views may not have their
                        //                'selectedVariable' layer correctly initialized.
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
                        imageryLayer.minificationFilter = Cesium.TextureMinificationFilter.NEAREST;
                        imageryLayer.magnificationFilter = Cesium.TextureMagnificationFilter.NEAREST;
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

    private updateVectorLayers(viewer: Cesium.Viewer,
                               currentLayers: VectorLayerDescriptor[],
                               nextLayers: VectorLayerDescriptor[],
                               dataSourceMap: DataSourceMap,
                               selectedPlacemarkId: string | null) {
        if (this.props.debug) {
            console.log('CesiumGlobe: updating vector layers');
        }
        const actions = arrayDiff<VectorLayerDescriptor>(currentLayers, nextLayers);
        for (let action of actions) {
            if (this.props.debug) {
                console.log('CesiumGlobe: next vector layer action', action);
            }
            //const index = action.index;
            switch (action.type) {
                case 'ADD': {
                    this.addDataSource(viewer, action.newElement, dataSourceMap);
                    break;
                }
                case 'REMOVE': {
                    this.removeDataSource(viewer, action.oldElement, dataSourceMap);
                    break;
                }
                case 'UPDATE': {
                    this.updateDataSource(viewer, action.oldElement, action.newElement, dataSourceMap, selectedPlacemarkId);
                    break;
                }
                case 'MOVE': {
                    // order of dataSources seems to have no effect in Cesium
                    break;
                }
                default:
                    console.error(`CesiumGlobe: unhandled layer action type "${action.type}"`);
            }
        }
    }

    private static updateOverlayHtml(viewer: Cesium.Viewer, prevOverlayHtml: HTMLElement, nextOverlayHtml: HTMLElement) {
        // console.log('updateOverlayHtml', prevOverlayHtml, nextOverlayHtml);
        if (nextOverlayHtml) {
            if (prevOverlayHtml) {
                if (!viewer.container.contains(prevOverlayHtml)) {
                    // TODO (forman): Check, if we still get here.
                    console.warn("CesiumGlobe: previous HTML element is not a child", prevOverlayHtml);
                    return;
                }
                viewer.container.replaceChild(nextOverlayHtml, prevOverlayHtml);
            } else {
                viewer.container.appendChild(nextOverlayHtml);
            }
        } else if (prevOverlayHtml) {
            if (!viewer.container.contains(prevOverlayHtml)) {
                // TODO (forman): Check, if we still get here.
                console.warn("CesiumGlobe: previous HTML element is not a child", prevOverlayHtml);
                return;
            }
            viewer.container.removeChild(prevOverlayHtml);
        }
    }

    private static updateSplitLayers(viewer: Cesium.Viewer, prevSplitLayerIndex: number, nextSplitLayerIndex: number) {
        for (let cesiumIndex = 1; cesiumIndex < viewer.imageryLayers.length; cesiumIndex++) {
            const i = cesiumIndex - 1;
            const layer = viewer.imageryLayers.get(cesiumIndex);
            if (i === prevSplitLayerIndex) {
                layer.splitDirection = Cesium.ImagerySplitDirection.NONE;
            }
            if (i === nextSplitLayerIndex) {
                layer.splitDirection = Cesium.ImagerySplitDirection.LEFT;
            }
        }
    }

    private static getImageryProvider(viewer: Cesium.Viewer, layerDescriptor: ImageLayerDescriptor): Cesium.ImageryProvider {
        if (layerDescriptor.imageryProvider) {
            if (typeof layerDescriptor.imageryProvider === 'function') {
                return layerDescriptor.imageryProvider(viewer, layerDescriptor.imageryProviderOptions);
            } else {
                return layerDescriptor.imageryProvider;
            }
        }
        return null;
    }

    // https://cesiumjs.org/Cesium/Build/Documentation/GeoJsonDataSource.html
    private static getDataSource(viewer: Cesium.Viewer, dataSourceDescriptor: VectorLayerDescriptor): Cesium.DataSource | Promise<Cesium.DataSource> {
        if (dataSourceDescriptor.dataSource) {
            if (typeof dataSourceDescriptor.dataSource === 'function') {
                return dataSourceDescriptor.dataSource(viewer, dataSourceDescriptor.dataSourceOptions);
            } else {
                return dataSourceDescriptor.dataSource;
            }
        }
        return null;
    }

    private addDataSource(viewer: Cesium.Viewer,
                          layer: VectorLayerDescriptor,
                          dataSourceMap: DataSourceMap): void {
        const dataSourcePromise = CesiumGlobe.getDataSource(viewer, layer);
        assert.ok(dataSourcePromise);
        Promise.resolve(viewer.dataSources.add(dataSourcePromise)).then((resolvedDataSource) => {
            if (this.props.debug) {
                console.log(`CesiumGlobe: added data source: ${layer.name}`);
            }
            dataSourceMap[layer.id] = resolvedDataSource;
            CesiumGlobe.setDataSourceProps(resolvedDataSource, layer);
        });
    }

    private removeDataSource(viewer: Cesium.Viewer,
                             layer: VectorLayerDescriptor,
                             dataSourceMap: DataSourceMap) {
        const dataSource = dataSourceMap[layer.id];
        if (dataSource) {
            delete dataSourceMap[layer.id];
            viewer.dataSources.remove(dataSource, true);
            if (this.props.debug) {
                console.log(`CesiumGlobe: removed data source: ${layer.name}`);
            }
        }
    }

    private updateDataSource(viewer: Cesium.Viewer,
                             oldLayer: VectorLayerDescriptor,
                             newLayer: VectorLayerDescriptor,
                             dataSourceMap: DataSourceMap,
                             selectedPlacemarkId: string | null) {
        const layerId = newLayer.id;
        const dataSource = dataSourceMap[layerId];
        if (!dataSource) {
            console.warn("CesiumGlobe: dataSource for vector layer not ready yet, layerId =", layerId);
            return;
        }
        const oldData = oldLayer.dataSourceOptions.data;
        const newData = newLayer.dataSourceOptions.data;
        if (oldData !== newData) {
            console.log("CesiumGlobe.updateDataSource: updateData");
            if (isString(newData)) {
                // URL change: must load new dataSource
                this.removeDataSource(viewer, oldLayer, dataSourceMap);
                this.addDataSource(viewer, newLayer, dataSourceMap);
            } else {
                // Change of placemarks (a GeoJSON FeatureCollection)
                this.updatePlacemarks(dataSource.entities, oldData, newData, newLayer.style).then(() => {
                    if (selectedPlacemarkId) {
                        const selectedEntity = dataSource.entities.getById(selectedPlacemarkId);
                        if (selectedEntity && selectedEntity !== viewer.selectedEntity) {
                            viewer.selectedEntity = selectedEntity;
                        }
                    }
                });
            }
        }
        const oldStyle = oldLayer.style;
        const newStyle = newLayer.style;
        if (oldStyle !== newStyle) {
            const styleDelta = diff(oldStyle, newStyle);
            console.log("CesiumGlobe.updateDataSource: styleDelta = ", styleDelta);
            if (Object.getOwnPropertyNames(styleDelta).length > 0) {
                const cStyle = simpleStyleToCesium(styleDelta, newStyle);
                applyStyleToEntityCollection(cStyle, dataSource.entities.values);
            }
        }
        const oldEntityStyles = oldLayer.entityStyles;
        const newEntityStyles = newLayer.entityStyles;
        if (oldEntityStyles !== newEntityStyles) {
            const entityStylesDelta = diff(oldEntityStyles, newEntityStyles);
            console.log("CesiumGlobe.updateDataSource: entityStylesDelta = ", entityStylesDelta);
            for (let entityId of Object.getOwnPropertyNames(entityStylesDelta)) {
                const entity = dataSource.entities.getById(entityId);
                if (entity) {
                    const entityStyleDelta = entityStylesDelta[entityId];
                    if (Object.getOwnPropertyNames(entityStyleDelta).length > 0) {
                        const cStyle = simpleStyleToCesium(entityStyleDelta, newEntityStyles[entityId]);
                        applyStyleToEntity(cStyle, entity)
                    }
                }
            }
        }
        CesiumGlobe.setDataSourceProps(dataSource, newLayer);
    }

    private addLayer(viewer: Cesium.Viewer, layerDescriptor: ImageLayerDescriptor, layerIndex: number): Cesium.ImageryLayer {
        const imageryProvider = CesiumGlobe.getImageryProvider(viewer, layerDescriptor);
        const imageryLayer = viewer.imageryLayers.addImageryProvider(imageryProvider, layerIndex);
        if (this.props.debug) {
            console.log(`CesiumGlobe: added imagery layer #${layerIndex}: ${layerDescriptor.name}`);
        }
        return imageryLayer;
    }

    private removeLayer(viewer: Cesium.Viewer, imageryLayer: Cesium.ImageryLayer, layerIndex: number): void {
        viewer.imageryLayers.remove(imageryLayer, true);
        if (this.props.debug) {
            console.log(`CesiumGlobe: removed imagery layer #${layerIndex}`);
        }
    }

    private static setLayerProps(imageryLayer: Cesium.ImageryLayer, layerDescriptor: ImageLayerDescriptor) {
        //imageryLayer.name = layerDescriptor.name;
        imageryLayer.show = layerDescriptor.visible;
        imageryLayer.alpha = layerDescriptor.opacity;
        imageryLayer.brightness = layerDescriptor.brightness;
        imageryLayer.contrast = layerDescriptor.contrast;
        imageryLayer.hue = layerDescriptor.hue;
        imageryLayer.saturation = layerDescriptor.saturation;
        imageryLayer.gamma = layerDescriptor.gamma;
        imageryLayer.minificationFilter = Cesium.TextureMinificationFilter.NEAREST;
        imageryLayer.magnificationFilter = Cesium.TextureMagnificationFilter.NEAREST;
    }

    private static setDataSourceProps(dataSource: Cesium.DataSource
        | Promise<Cesium.DataSource>, dataSourceDescriptor: VectorLayerDescriptor) {
        Promise.resolve(dataSource).then((resolvedDataSource: Cesium.DataSource) => {
            //resolvedDataSource.name = dataSourceDescriptor.name;
            resolvedDataSource.show = dataSourceDescriptor.visible;
        });
    }

    private static copyEntities(from: Cesium.EntityCollection, to: Cesium.EntityCollection, show: boolean) {
        for (let entity of from.values) {
            entity.show = show;
            to.add(entity);
        }
    }

    activateGeometryTool(viewer: Cesium.Viewer, geometryToolType: GeometryToolType) {
        const tool = this.toolContext.tool;
        if (geometryToolType !== tool.type) {
            if (geometryToolType === "NoTool") {
                this.toolContext.tool = NO_TOOL;
            } else if (geometryToolType === "PointTool") {
                this.toolContext.tool = new PointTool();
            } else if (geometryToolType === "PolylineTool") {
                this.toolContext.tool = new PolylineTool();
            } else if (geometryToolType === "PolygonTool") {
                this.toolContext.tool = new PolygonTool();
            } else if (geometryToolType === "BoxTool") {
                this.toolContext.tool = new BoxTool();
            }
        }
    }
}

function screenToCartographic(viewer: Cesium.Viewer, screenPoint?: Cesium.Cartesian2, degrees?: boolean): Cesium.Cartographic {
    let canvasPoint;
    if (screenPoint) {
        const rect = viewer.canvas.getBoundingClientRect();
        const x = screenPoint.x;
        const y = screenPoint.y;
        if ((x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)) {
            canvasPoint = new Cesium.Cartesian2(x - rect.left, y - rect.top);
        }
    }
    if (canvasPoint) {
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
    return null;
}
