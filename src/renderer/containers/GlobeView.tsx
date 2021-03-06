import * as React from 'react';
import { CSSProperties } from 'react';
import { connect, DispatchProp } from 'react-redux';
import {
    LayerState,
    OperationState,
    Placemark,
    PlacemarkCollection,
    ResourceState,
    SPLIT_MODE_OFF,
    State,
    VariableImageLayerState,
    WorkspaceState,
    WorldViewDataState,
} from '../state';
import * as selectors from '../selectors';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '../selectors';
import * as actions from '../actions';
import { NO_WEB_GL } from '../messages';
import {
    CanvasPosition,
    CesiumGlobe,
    GeographicPosition,
    ImageLayerDescriptor,
    LayerDescriptors
} from '../components/cesium/CesiumGlobe';
import { findVariableIndexCoordinates, PLACEMARK_ID_PREFIX } from '../state-util';
import { ViewState } from '../components/ViewState';
import { convertLayersToLayerDescriptors } from './globe-view-layers';
import * as Cesium from 'cesium';
import { GeometryToolType } from '../components/cesium/geometry-tool';
import { entityToGeoJson, entityToGeometryWkt } from '../components/cesium/cesium-util';
import { featurePropertiesFromSimpleStyle, SimpleStyle } from '../../common/geojson-simple-style';
import { Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { GEOMETRY_LIKE_TYPE, POINT_LIKE_TYPE, POLYGON_LIKE_TYPE } from '../../common/cate-types';
import { geometryGeoJsonToGeometryWkt } from '../../common/geometry-util';

interface IGlobeViewOwnProps {
    view: ViewState<WorldViewDataState>;
}

interface IGlobeViewProps extends IGlobeViewOwnProps {
    baseUrl: string;
    operations: OperationState[] | null;
    workspace: WorkspaceState | null;
    offlineMode: boolean;
    placemarks: PlacemarkCollection;
    selectedLayer: LayerState | null;
    selectedLayerId: string | null;
    selectedPlacemarkId: string | null;
    isDialogOpen: boolean;
    showLayerTextOverlay: boolean;
    debugWorldView: boolean;
    hasWebGL: boolean;
    externalObjectStore: any;
    newPlacemarkToolType: GeometryToolType;
    defaultPlacemarkStyle: SimpleStyle;
}

function mapStateToProps(state: State, ownProps: IGlobeViewOwnProps): IGlobeViewProps {
    return {
        view: ownProps.view,
        baseUrl: selectors.webAPIRestUrlSelector(state),
        operations: selectors.operationsSelector(state),
        workspace: selectors.workspaceSelector(state),
        offlineMode: selectors.offlineModeSelector(state),
        placemarks: selectors.placemarkCollectionSelector(state),
        selectedLayer: selectors.selectedLayerSelector(state),
        selectedLayerId: selectors.selectedLayerIdSelector(state),
        selectedPlacemarkId: selectors.selectedPlacemarkIdSelector(state),
        isDialogOpen: selectors.isDialogOpenSelector(state),
        showLayerTextOverlay: state.session.showLayerTextOverlay,
        debugWorldView: state.session.debugWorldView,
        hasWebGL: state.data.appConfig.hasWebGL,
        externalObjectStore: selectors.externalObjectStoreSelector(state),
        newPlacemarkToolType: selectors.newPlacemarkToolTypeSelector(state),
        defaultPlacemarkStyle: selectors.defaultPlacemarkStyleSelector(state),
    };
}

/**
 * This component displays a 3D globe with a number of layers.
 */
class GlobeView extends React.Component<IGlobeViewProps & IGlobeViewOwnProps & DispatchProp<State>> {
    static readonly CESIUM_GLOBE_STYLE: CSSProperties = {
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
    };
    static readonly POS_UPDATE_PERIOD: number = 500;

    intervalHandle: number | null;
    lastPosition: GeographicPosition | null;
    positionChanged: boolean;

    constructor(props: IGlobeViewProps & IGlobeViewOwnProps & DispatchProp<State>) {
        super(props);
        this.intervalHandle = null;
        this.lastPosition = null;
        this.positionChanged = false;
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleSelectedEntityChanged = this.handleSelectedEntityChanged.bind(this);
        this.handleNewEntityAdded = this.handleNewEntityAdded.bind(this);
        this.handleSplitLayerPosChange = this.handleSplitLayerPosChange.bind(this);
        this.handlePosDataUpdate = this.handlePosDataUpdate.bind(this);
        this.renderContextMenu = this.renderContextMenu.bind(this);
    }

    componentDidMount(): void {
        this.intervalHandle = window.setInterval(this.handlePosDataUpdate, GlobeView.POS_UPDATE_PERIOD);
    }

    componentWillUnmount(): void {
        window.clearInterval(this.intervalHandle);
    }

    handlePosDataUpdate() {
        if (this.positionChanged) {
            this.props.dispatch(actions.setGlobeViewPosition(this.lastPosition) as any);
            this.positionChanged = false;
        }
    }

    handleMouseMove(newPosition: GeographicPosition | undefined | null) {
        const lastPosition = this.lastPosition;
        if (newPosition !== lastPosition) {
            if (!newPosition || !lastPosition
                || newPosition.longitude !== lastPosition.longitude
                || newPosition.latitude !== lastPosition.latitude) {
                this.props.dispatch(actions.setGlobeMousePosition(newPosition));
                this.lastPosition = newPosition;
                this.positionChanged = true;
            }
        }
    }

    handleSelectedEntityChanged(selectedEntity: Cesium.Entity | null) {
        this.props.dispatch(actions.notifySelectedEntityChange(this.props.view.id, this.props.selectedLayer, selectedEntity) as any);
    }

    handleNewEntityAdded(newEntity: Cesium.Entity) {
        // Logic should actually go to actions.ts or reducers.ts, but newEntity:Cesium.Entity is not serializable.
        const properties = this.newPlacemarkProperties();
        const feature = entityToGeoJson(newEntity, `${PLACEMARK_ID_PREFIX}${newEntity.id}`, properties);
        this.props.dispatch(actions.addPlacemark(feature as Placemark));
    }

    handleSplitLayerPosChange(layerSplitPosition: number) {
        this.props.dispatch(actions.setLayerSplitPosition(this.props.view.id, layerSplitPosition));
    }

    renderContextMenu(geoPos: GeographicPosition, canvasPos: CanvasPosition, entity?: Cesium.Entity) {

        if (!geoPos && !entity) {
            return null;
        }

        const entityId = entity && entity.id;
        let placemark;
        if (entityId && entityId.startsWith(PLACEMARK_ID_PREFIX) && this.props.placemarks) {
            placemark = this.props.placemarks.features.find(p => p.id === entityId);
        }

        let wkt;
        if (placemark) {
            wkt = geometryGeoJsonToGeometryWkt(placemark.geometry);
        } else if (entity) {
            wkt = entityToGeometryWkt(entity);
        } else if (geoPos) {
            wkt = `POINT (${geoPos.longitude} ${geoPos.latitude})`;
        }

        let key = 0;

        const menuItems = [];
        if (geoPos) {
            const properties = this.newPlacemarkProperties();
            const action = actions.addPointPlacemark(geoPos.longitude, geoPos.latitude, properties);
            menuItems.push(<MenuItem key={key}
                                     icon="map-marker"
                                     text="Place point marker here"
                                     onClick={() => this.props.dispatch(action)}/>);
            key++;
        }

        if (wkt) {
            menuItems.push(<MenuItem key={key} icon="clipboard" text="Copy geometry WKT"
                                     onClick={() => actions.copyTextToClipboard(wkt)}/>);
            key++;
        }

        const operations = this.props.operations;
        if (entity && operations) {

            let expectedInputType;
            if (wkt.startsWith('POINT ')) {
                expectedInputType = POINT_LIKE_TYPE;
            } else if (wkt.startsWith('POLYGON ')) {
                expectedInputType = POLYGON_LIKE_TYPE;
            }

            if (expectedInputType) {
                let dividerAdded = false;
                for (let operation of  operations) {
                    let geometryInput;
                    for (let input of operation.inputs) {
                        const dataType = input.dataType;
                        if (dataType === expectedInputType || dataType === GEOMETRY_LIKE_TYPE) {
                            geometryInput = input;
                            break;
                        }
                    }
                    if (geometryInput) {
                        if (!dividerAdded) {
                            menuItems.push(<MenuDivider key={key}/>);
                            dividerAdded = true;
                            key++;
                        }
                        const inputAssignments = {
                            [geometryInput.name]: {
                                isValueUsed: true,
                                constantValue: wkt,
                                resourceName: null
                            }
                        };
                        const action = actions.invokeCtxOperation(operation, inputAssignments);
                        const text = `${operation.name}()`;
                        menuItems.push(<MenuItem key={key}
                                                 icon="function" text={text}
                                                 onClick={() => this.props.dispatch(action as any)}/>);
                        key++;
                    }
                }
            }
        }

        return (<Menu>{menuItems}</Menu>);
    }

    private newPlacemarkProperties() {
        return {visible: true, ...featurePropertiesFromSimpleStyle(this.props.defaultPlacemarkStyle)};
    }

    render() {
        if (!this.props.hasWebGL) {
            return NO_WEB_GL;
        }

        const view = this.props.view;
        const viewId = this.props.view.id;
        const layers = view.data.layers;
        const placemarks = this.props.placemarks;
        const showLayerTextOverlay = this.props.showLayerTextOverlay;
        const workspace = this.props.workspace;
        const resources = (workspace && workspace.resources) || EMPTY_ARRAY;

        // TODO (nf): Note that following local vars descriptors, splitLayerIndex, overlayHtml...
        // ...could be provided by selectors but there is a dependency on this.props.view which is
        // an own component property.
        // May be solved by
        // - https://github.com/reactjs/reselect/blob/master/README.md#accessing-react-props-in-selectors
        // - https://github.com/reactjs/reselect/blob/master/README.md#q-how-do-i-create-a-selector-that-takes-an-argument
        //
        let descriptors;
        let selectedPlacemarkId = null;
        if (workspace) {
            const baseUrl = this.props.baseUrl;
            const baseDir = workspace.baseDir;
            descriptors = convertLayersToLayerDescriptors(layers, resources, placemarks, baseUrl, baseDir);
            selectedPlacemarkId = this.props.selectedPlacemarkId;
        } else {
            descriptors = EMPTY_OBJECT as LayerDescriptors;
        }
        const imageLayerDescriptors = descriptors.imageLayerDescriptors || EMPTY_ARRAY;
        const vectorLayerDescriptors = descriptors.vectorLayerDescriptors || EMPTY_ARRAY;
        let splitLayerPosition;
        if (hasSplitLayer(imageLayerDescriptors)) {
            splitLayerPosition = view.data.layerSplitPosition;
        }
        const overlayHtml = getOverlayHtml(layers, showLayerTextOverlay, viewId, resources);

        return (
            <CesiumGlobe id={'CesiumGlobe-' + view.id}
                         debug={this.props.debugWorldView}
                         externalObjectStore={this.props.externalObjectStore}
                         selectedPlacemarkId={selectedPlacemarkId}
                         imageLayerDescriptors={imageLayerDescriptors}
                         vectorLayerDescriptors={vectorLayerDescriptors}
                         splitLayerPosition={splitLayerPosition}
                         overlayHtml={overlayHtml}
                         onLayerSplitPosChange={this.handleSplitLayerPosChange}
                         offlineMode={this.props.offlineMode}
                         style={GlobeView.CESIUM_GLOBE_STYLE}
                         onMouseMove={this.props.isDialogOpen ? null : this.handleMouseMove}
                         onSelectedEntityChanged={this.handleSelectedEntityChanged}
                         onNewEntityAdded={this.handleNewEntityAdded}
                         geometryToolType={this.props.newPlacemarkToolType}
                         renderContextMenu={this.renderContextMenu}
            />
        );
    }
}

export default connect(mapStateToProps)(GlobeView);

function getOverlayHtml(layers: LayerState[],
                        showLayerTextOverlay: boolean,
                        viewId,
                        resources: ResourceState[]): HTMLDivElement {
    let overlayHtml: HTMLDivElement = null;
    if (!showLayerTextOverlay) {
        return overlayHtml;
    }
    // let layerInfoCount = 0;
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
        let layer = layers[layerIndex] as any as VariableImageLayerState;
        if (layer.type === 'VariableImage') {
            if (layer.visible) {
                const indexCoords = findVariableIndexCoordinates(resources, layer);
                if (!overlayHtml) {
                    overlayHtml = document.createElement('div');
                    overlayHtml.id = 'CesiumGlobeOverlay-' + viewId;
                    overlayHtml.style.position = 'absolute';
                    overlayHtml.style['z-index'] = 10;
                    overlayHtml.style['pointer-events'] = 'none';
                    overlayHtml.style['padding'] = '1em';
                    overlayHtml.style['background-color'] = 'rgba(0, 0, 0, 0.25)';
                }
                let varText;
                if (indexCoords && indexCoords.length) {
                    varText = layer.name + ' at ' + indexCoords.map(e => e.join(' = ')).join(', ');
                } else {
                    varText = layer.name;
                }
                const textDivElement = document.createElement('div');
                textDivElement.style['font-size'] = '1.4em';
                textDivElement.innerText = varText;
                overlayHtml.appendChild(textDivElement);
                overlayHtml.style.top = '0';
                overlayHtml.style.width = '100%';
                // layerInfoCount++;
            }
        }
    }
    return overlayHtml;
}

function hasSplitLayer(layerDescriptors: ImageLayerDescriptor[]) {
    for (let ld of layerDescriptors) {
        const splitMode = ld.splitMode || SPLIT_MODE_OFF;
        if (splitMode !== SPLIT_MODE_OFF) {
            return true;
        }
    }
    return false;
}


