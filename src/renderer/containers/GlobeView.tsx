import * as React from 'react';
import {
    State, WorkspaceState, VariableImageLayerState,
    VariableState, VariableRefState, VectorLayerState, ResourceState, WorldViewDataState, GeographicPosition, Placemark,
    ResourceVectorLayerState, ResourceRefState
} from "../state";
import {
    CesiumGlobe, LayerDescriptor, ImageryProvider, DataSourceDescriptor,
    DataSource, GeoJsonDataSource, Viewer
} from "../components/cesium/CesiumGlobe";
import {connect, DispatchProp} from "react-redux";
import {
    findVariable, findResource, getTileUrl, getFeatureCollectionUrl, getGeoJSONCountriesUrl,
    COUNTRIES_LAYER_ID, SELECTED_VARIABLE_LAYER_ID, findVariableIndexCoordinates
} from "../state-util";
import {ViewState} from "../components/ViewState";
import * as selectors from "../selectors";
import * as actions from "../actions";
import {NO_WEB_GL} from "../messages";

const Cesium: any = require('cesium');

interface IGlobeViewOwnProps {
    view: ViewState<WorldViewDataState>;
}

interface IGlobeViewProps extends IGlobeViewOwnProps {
    baseUrl: string;
    workspace: WorkspaceState | null;
    offlineMode: boolean;
    worldViewClickAction: string | null;
    placemarks: Placemark[];
    selectedLayerId: string | null;
    selectedPlacemarkId: string | null;
    isDialogOpen: boolean;
    showLayerTextOverlay: boolean;
    debugWorldView: boolean;
    hasWebGL: boolean;
}

function mapStateToProps(state: State, ownProps: IGlobeViewOwnProps): IGlobeViewProps {
    return {
        view: ownProps.view,
        baseUrl: selectors.webAPIRestUrlSelector(state),
        workspace: selectors.workspaceSelector(state),
        offlineMode: selectors.offlineModeSelector(state),
        worldViewClickAction: state.control.worldViewClickAction,
        placemarks: selectors.placemarksSelector(state),
        selectedLayerId: selectors.selectedLayerIdSelector(state),
        selectedPlacemarkId: selectors.selectedPlacemarkIdSelector(state),
        isDialogOpen: selectors.isDialogOpenSelector(state),
        showLayerTextOverlay: state.session.showLayerTextOverlay,
        debugWorldView: state.session.debugWorldView,
        hasWebGL: state.data.appConfig.hasWebGL,
    };
}

/**
 * This component displays a 3D globe with a number of layers.
 */
class GlobeView extends React.Component<IGlobeViewProps & IGlobeViewOwnProps & DispatchProp<State>, null> {
    static readonly CESIUM_GLOBE_STYLE = {position: 'relative', width: "100%", height: "100%", overflow: "hidden"};

    constructor(props: IGlobeViewProps & IGlobeViewOwnProps & DispatchProp<State>) {
        super(props);
        this.handleMouseMoved = this.handleMouseMoved.bind(this);
        this.handleMouseClicked = this.handleMouseClicked.bind(this);
        this.handleLeftUp = this.handleLeftUp.bind(this);
        this.handlePlacemarkSelected = this.handlePlacemarkSelected.bind(this);
        this.handleSplitLayerPosChange = this.handleSplitLayerPosChange.bind(this);
    }

    handleMouseMoved(position: GeographicPosition) {
        this.props.dispatch(actions.setGlobeMousePosition(position));
    }

    handleMouseClicked(position: GeographicPosition) {
        if (this.props.worldViewClickAction === actions.ADD_PLACEMARK && position) {
            this.props.dispatch(actions.addPlacemark(position));
            this.props.dispatch(actions.updateControlState({worldViewClickAction: null}));
        }
    }

    handleLeftUp(position: GeographicPosition) {
        this.props.dispatch(actions.setGlobeViewPosition(position));
    }

    handlePlacemarkSelected(selectedPlacemarkId: string | null) {
        this.props.dispatch(actions.setSelectedPlacemarkId(selectedPlacemarkId));
    }

    handleSplitLayerPosChange(splitLayerPos: number) {
        this.props.dispatch(actions.setSelectedLayerSplitPos(this.props.view.id, splitLayerPos));
    }

    render() {

        if (!this.props.hasWebGL) {
            return NO_WEB_GL;
        }

        const placemarks = this.props.placemarks;
        const layers = [];
        const dataSources = [];
        let overlayHtml = null;
        let splitLayerIndex = -1;
        const isSelectedLayerSplit = this.props.view.data.isSelectedLayerSplit;
        // TODO (forman): optimize me: increase speed and clean up code by moving the following into selectors.ts
        if (this.props.workspace && this.props.workspace.resources && this.props.view.data.layers) {
            let layerInfoCount = 0;
            for (let layer of this.props.view.data.layers) {
                let layerDescriptor;
                let dataSourceDescriptor;
                switch (layer.type) {
                    case 'VariableImage': {
                        const variableImageLayer = layer as VariableImageLayerState;
                        layerDescriptor = this.convertVariableImageLayerToLayerDescriptor(variableImageLayer);
                        if (layerDescriptor) {
                            if (isSelectedLayerSplit) {
                                splitLayerIndex = layers.length;
                            }
                            if (variableImageLayer.visible && this.props.showLayerTextOverlay) {
                                const indexCoords = findVariableIndexCoordinates(this.props.workspace.resources, variableImageLayer);
                                if (!overlayHtml) {
                                    overlayHtml = document.createElement('div');
                                    overlayHtml.id = 'CesiumGlobeOverlay-' + this.props.view.id;
                                    overlayHtml.style.position = 'relative';
                                    overlayHtml.style['z-index'] = 100;
                                    overlayHtml.style['pointer-events'] = 'none';
                                    overlayHtml.style['padding'] = '1em';
                                    overlayHtml.style['background-color'] = 'rgba(0, 0, 0, 0.25)';
                                }
                                let varText;
                                if (indexCoords && indexCoords.length) {
                                    varText = variableImageLayer.name + ' at ' + indexCoords.map(e => e.join(' = ')).join(', ');
                                } else {
                                    varText = variableImageLayer.name;
                                }
                                const textDivElement = document.createElement('div');
                                textDivElement.style['font-size'] = '1.4em';
                                textDivElement.innerText = varText;
                                overlayHtml.appendChild(textDivElement);
                                overlayHtml.style.top = `-${2 + (layerInfoCount + 1) * 1.5}em`;
                                layerInfoCount++;
                            }
                        }
                        break;
                    }
                    case 'ResourceVector': {
                        dataSourceDescriptor = this.convertResourceVectorLayerToDataSourceDescriptor(layer as ResourceVectorLayerState);
                        break;
                    }
                    case 'Vector': {
                        dataSourceDescriptor = this.convertVectorLayerToDataSourceDescriptor(layer as VectorLayerState);
                        break;
                    }
                }
                if (layerDescriptor) {
                    layers.push(layerDescriptor);
                } else if (dataSourceDescriptor) {
                    dataSources.push(dataSourceDescriptor);
                } else if (layer.id !== SELECTED_VARIABLE_LAYER_ID) {
                    console.warn(`GlobeView: layer with ID "${layer.id}" will not be rendered`);
                }
            }
        }

        return (
            <CesiumGlobe id={'CesiumGlobe-' + this.props.view.id}
                         debug={this.props.debugWorldView}
                         selectedPlacemarkId={this.props.selectedPlacemarkId}
                         placemarks={placemarks}
                         layers={layers}
                         dataSources={dataSources}
                         overlayHtml={overlayHtml}
                         splitLayerIndex={splitLayerIndex}
                         splitLayerPos={this.props.view.data.selectedLayerSplitPos}
                         onSplitLayerPosChange={this.handleSplitLayerPosChange}
                         offlineMode={this.props.offlineMode}
                         style={GlobeView.CESIUM_GLOBE_STYLE}
                         onMouseMoved={this.props.isDialogOpen ? null : this.handleMouseMoved}
                         onMouseClicked={this.props.isDialogOpen ? null : this.handleMouseClicked}
                         onLeftUp={this.props.isDialogOpen ? null : this.handleLeftUp}
                         onPlacemarkSelected={this.handlePlacemarkSelected}
            />
        );
    }

    private getResource(ref: ResourceRefState): ResourceState {
        return findResource(this.props.workspace.resources, ref);
    }

    private getVariable(ref: VariableRefState): VariableState {
        return findVariable(this.props.workspace.resources, ref);
    }

    private convertVariableImageLayerToLayerDescriptor(layer: VariableImageLayerState): LayerDescriptor | null {
        const variable = this.getVariable(layer);
        if (!variable) {
            console.warn(`GlobeView: variable "${layer.varName}" not found in resource "${layer.resName}"`);
            return null;
        }
        const imageLayout = variable.imageLayout;
        if (!variable.imageLayout) {
            console.warn(`GlobeView: variable "${layer.varName}" of resource "${layer.resName}" has no imageLayout`);
            return null;
        }
        const baseDir = this.props.workspace.baseDir;
        const url = getTileUrl(this.props.baseUrl, baseDir, layer);
        let rectangle = Cesium.Rectangle.MAX_VALUE;
        if (imageLayout.extent) {
            const extent = imageLayout.extent;
            rectangle = Cesium.Rectangle.fromDegrees(extent.west, extent.south, extent.east, extent.north);
        }
        return Object.assign({}, layer, {
            imageryProvider: GlobeView.createImageryProvider,
            imageryProviderOptions: {
                url,
                rectangle,
                minimumLevel: 0,
                maximumLevel: imageLayout.numLevels - 1,
                tileWidth: imageLayout.tileWidth,
                tileHeight: imageLayout.tileHeight,
                tilingScheme: new Cesium.GeographicTilingScheme({
                                                                    rectangle,
                                                                    numberOfLevelZeroTilesX: imageLayout.numLevelZeroTilesX,
                                                                    numberOfLevelZeroTilesY: imageLayout.numLevelZeroTilesY
                                                                }),
            },
        });
    }

    private convertResourceVectorLayerToDataSourceDescriptor(layer: ResourceVectorLayerState): DataSourceDescriptor | null {
        const resource = this.getResource(layer);

        const baseDir = this.props.workspace.baseDir;
        const url = getFeatureCollectionUrl(this.props.baseUrl, baseDir, layer);
        const dataSourceName = resource.name;

        const dataSource = (viewer: Viewer, dataSourceOptions) => {
            let numFeatures = 0;
            const customDataSource: DataSource = new Cesium.CustomDataSource(dataSourceOptions.name);

            const worker = new Worker("common/stream-geojson.js");
            worker.postMessage(dataSourceOptions.url);
            worker.onmessage = function (event: MessageEvent) {

                const features = event.data;
                if (!features) {
                    console.log(`Received ${numFeatures} feature(s) in total from ${url}`);
                    return;
                }

                numFeatures += features.length;
                console.log(`Received another ${features.length} feature(s) from ${url}`);

                const defaultStyle = {
                    stroke: Cesium.Color.BLACK,
                    strokeOpacity: 0.5,
                    strokeWidth: 2,
                    fill: [Cesium.Color.RED, Cesium.Color.GREEN, Cesium.Color.BLUE, Cesium.Color.YELLOW][Math.floor(100 * Math.random()) % 4],
                    fillOpacity: 0.5,
                    clampToGround: true,
                };

                const pointColor = Cesium.Color.fromAlpha(Cesium.Color.ORANGE, 0.9);
                const pointOutlineColor = Cesium.Color.fromAlpha(Cesium.Color.ORANGE, 0.5);

                Cesium.GeoJsonDataSource.load({type: 'FeatureCollection', features: features}, defaultStyle)
                    .then((geoJsonDataSource: GeoJsonDataSource) => {

                        const featureMap = new Map();
                        features.forEach(f => featureMap.set(f.id, f));

                        const scaleByDistance = new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.1);
                        const translucencyByDistance = new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.25);

                        geoJsonDataSource.entities.suspendEvents();
                        customDataSource.entities.suspendEvents();
                        for (let entity of geoJsonDataSource.entities.values) {
                            //console.log('entity: ', entity);

                            // TODO (nf/mz): Generalize this code. This is for Glaciers CCI.
                            const pixelSizeMin = 10;
                            const pixelSizeMax = 50;
                            const areaMin = 20.;
                            const areaMax = 500.;
                            const feature = featureMap.get(entity.id);
                            let ratio = 0.5;
                            let description;
                            let isPoint = !!(entity.point || entity.billboard || entity.label);
                            if (feature && feature.properties) {
                                let area = feature.properties['area_npl43'];
                                if (area) {
                                    ratio = (area - areaMin) / (areaMax - areaMin);
                                    if (ratio < 0.) {
                                        ratio = 0.;
                                    }
                                    if (ratio > 1.) {
                                        ratio = 1.;
                                    }
                                }

                                description = '<table class="cesium-infoBox-defaultTable cesium-infoBox-defaultTable-lighter"><tbody>';
                                Object.getOwnPropertyNames(feature.properties)
                                    .map(n => `<tr><th>${n}</th><td>${feature.properties[n]}</td></tr>`)
                                    .forEach(d => description += d);
                                description += '</tbody></table>';
                            }
                            const pixelSize = pixelSizeMin + ratio * (pixelSizeMax - pixelSizeMin);

                            if (isPoint) {
                                customDataSource.entities.add({
                                                                  id: entity.id,
                                                                  name: entity.id,
                                                                  position: entity.position,
                                                                  description,
                                                                  point: {
                                                                      color: pointColor,
                                                                      outlineColor: pointOutlineColor,
                                                                      outlineWidth: 5,
                                                                      // pixelSize will multiply by the scale factor, so in this
                                                                      // example the size will range from pixelSize (near) to 0.1*pixelSize (far).
                                                                      pixelSize,
                                                                      scaleByDistance,
                                                                      translucencyByDistance,
                                                                  }
                                                              });
                            } else {
                                customDataSource.entities.add(entity);
                            }
                        }

                        geoJsonDataSource.entities.removeAll();
                        customDataSource.entities.resumeEvents();
                        console.log(`Added another ${features.length} feature(s) to Cesium custom data source`);
                    });
            };
            return customDataSource;
        };

        return {
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            dataSource,
            dataSourceOptions: {url, name: dataSourceName},
        };
    }

    private convertVectorLayerToDataSourceDescriptor(layer: VectorLayerState): DataSourceDescriptor | null {
        let url = layer.url;
        if (layer.id === COUNTRIES_LAYER_ID) {
            url = getGeoJSONCountriesUrl(this.props.baseUrl);
        }
        return {
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            dataSource: GlobeView.createGeoJsonDataSource,
            dataSourceOptions: {url},
        };
    }

    /**
     * Creates a Cesium.UrlTemplateImageryProvider instance.
     *
     * @param viewer the Cesium viewer
     * @param imageryProviderOptions see https://cesiumjs.org/Cesium/Build/Documentation/UrlTemplateImageryProvider.html
     */
    private static createImageryProvider(viewer: Viewer, imageryProviderOptions): ImageryProvider {
        const imageryProvider = new Cesium.UrlTemplateImageryProvider(imageryProviderOptions);
        imageryProvider.errorEvent.addEventListener((event) => {
            console.error('GlobeView:', event);
        });
        return imageryProvider;
    }

    /**
     * Creates a Cesium.GeoJsonDataSource instance.
     *
     * @param viewer the Cesium viewer
     * @param dataSourceOptions see https://cesiumjs.org/Cesium/Build/Documentation/GeoJsonDataSource.html
     */
    private static createGeoJsonDataSource(viewer: Viewer, dataSourceOptions): DataSource {
        return Cesium.GeoJsonDataSource.load(dataSourceOptions.url, {
            stroke: Cesium.Color.ORANGE,
            fill: new Cesium.Color(0, 0, 0, 0),
            strokeWidth: 5,
            markerSymbol: '?'
        });
    }

}

export default connect(mapStateToProps)(GlobeView);
