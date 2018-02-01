import * as React from 'react';
import {connect, DispatchProp} from "react-redux";
import {
    State, WorkspaceState, VariableImageLayerState,
    WorldViewDataState, ResourceState, LayerState, PlacemarkCollection,
} from "../state";
import * as selectors from "../selectors";
import * as actions from "../actions";
import {NO_WEB_GL} from "../messages";
import {EMPTY_ARRAY, EMPTY_OBJECT} from "../selectors";
import {CesiumGlobe, LayerDescriptors} from "../components/cesium/CesiumGlobe";
import {findVariableIndexCoordinates} from "../state-util";
import {ViewState} from "../components/ViewState";
import {convertLayersToLayerDescriptors} from "./globe-view-layers";
import * as Cesium from "cesium";

interface IGlobeViewOwnProps {
    view: ViewState<WorldViewDataState>;
}

interface IGlobeViewProps extends IGlobeViewOwnProps {
    baseUrl: string;
    workspace: WorkspaceState | null;
    offlineMode: boolean;
    worldViewClickAction: string | null;
    placemarks: PlacemarkCollection;
    selectedLayerId: string | null;
    selectedPlacemarkId: string | null;
    isDialogOpen: boolean;
    showLayerTextOverlay: boolean;
    debugWorldView: boolean;
    hasWebGL: boolean;
    externalObjectStore: any;
}

function mapStateToProps(state: State, ownProps: IGlobeViewOwnProps): IGlobeViewProps {
    return {
        view: ownProps.view,
        baseUrl: selectors.webAPIRestUrlSelector(state),
        workspace: selectors.workspaceSelector(state),
        offlineMode: selectors.offlineModeSelector(state),
        worldViewClickAction: state.control.worldViewClickAction,
        placemarks: selectors.placemarkCollectionSelector(state),
        selectedLayerId: selectors.selectedLayerIdSelector(state),
        selectedPlacemarkId: selectors.selectedPlacemarkIdSelector(state),
        isDialogOpen: selectors.isDialogOpenSelector(state),
        showLayerTextOverlay: state.session.showLayerTextOverlay,
        debugWorldView: state.session.debugWorldView,
        hasWebGL: state.data.appConfig.hasWebGL,
        externalObjectStore: selectors.externalObjectStoreSelector(state),
    };
}

function getOverlayHtml(layers: LayerState[],
                        showLayerTextOverlay: boolean,
                        viewId,
                        resources: ResourceState[]): HTMLDivElement {
    let overlayHtml: HTMLDivElement = null;
    if (!showLayerTextOverlay) {
        return overlayHtml;
    }
    let layerInfoCount = 0;
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
        let layer = layers[layerIndex] as any as VariableImageLayerState;
        if (layer.type === 'VariableImage') {
            if (layer.visible) {
                const indexCoords = findVariableIndexCoordinates(resources, layer);
                if (!overlayHtml) {
                    overlayHtml = document.createElement('div');
                    overlayHtml.id = 'CesiumGlobeOverlay-' + viewId;
                    overlayHtml.style.position = 'relative';
                    overlayHtml.style['z-index'] = 100;
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
                overlayHtml.style.top = `-${2 + (layerInfoCount + 1) * 1.5}em`;
                layerInfoCount++;
            }
        }
    }
    return overlayHtml;
}

function getSplitLayerIndex(layers: LayerState[], selectedLayerId: string | null, isSelectedLayerSplit: boolean) {
    let splitLayerIndex: number = -1;
    if (selectedLayerId && isSelectedLayerSplit) {
        for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
            let layer = layers[layerIndex];
            if (layer.id === selectedLayerId && layer.type === 'VariableImage') {
                return layerIndex;
            }
        }
    }
    return splitLayerIndex;
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
        this.handleSelectedEntityChanged = this.handleSelectedEntityChanged.bind(this);
        this.handleSplitLayerPosChange = this.handleSplitLayerPosChange.bind(this);
    }

    handleMouseMoved(position: Cesium.GeographicPosition) {
        this.props.dispatch(actions.setGlobeMousePosition(position));
    }

    handleMouseClicked(position: Cesium.GeographicPosition) {
        if (this.props.worldViewClickAction === actions.ADD_PLACEMARK && position) {
            this.props.dispatch(actions.addPlacemark(position));
            this.props.dispatch(actions.updateControlState({worldViewClickAction: null}));
        }
    }

    handleLeftUp(position: Cesium.GeographicPosition) {
        this.props.dispatch(actions.setGlobeViewPosition(position));
    }

    handleSelectedEntityChanged(selectedEntity: Cesium.Entity | null) {
        this.props.dispatch(actions.notifySelectedEntityChange(this.props.view.id, selectedEntity));
    }

    handleSplitLayerPosChange(splitLayerPos: number) {
        this.props.dispatch(actions.setSelectedLayerSplitPos(this.props.view.id, splitLayerPos));
    }

    render() {
        if (!this.props.hasWebGL) {
            return NO_WEB_GL;
        }

        const view = this.props.view;
        const viewId = this.props.view.id;
        const layers = view.data.layers;
        const selectedLayerId = view.data.selectedLayerId;
        const isSelectedLayerSplit = view.data.isSelectedLayerSplit;
        const placemarks = this.props.placemarks;
        const showLayerTextOverlay = this.props.showLayerTextOverlay;
        const workspace = this.props.workspace;
        const resources = (workspace && workspace.resources) || EMPTY_ARRAY;

        // TODO: Note that following local vars descriptors, splitLayerIndex, overlayHtml
        // could be provided by selectors but there is a dependency on this.props.view which is
        // an own component property.
        // May be solved by
        // - https://github.com/reactjs/reselect/blob/master/README.md#accessing-react-props-in-selectors
        // - https://github.com/reactjs/reselect/blob/master/README.md#q-how-do-i-create-a-selector-that-takes-an-argument
        //
        let descriptors;
        if (workspace) {
            const baseUrl = this.props.baseUrl;
            const baseDir = workspace.baseDir;
            descriptors = convertLayersToLayerDescriptors(layers, resources, placemarks, baseUrl, baseDir);
        } else {
            descriptors = EMPTY_OBJECT as LayerDescriptors;
        }
        let splitLayerIndex = getSplitLayerIndex(layers, selectedLayerId, isSelectedLayerSplit);
        let overlayHtml = getOverlayHtml(layers, showLayerTextOverlay, viewId, resources);

        return (
            <CesiumGlobe id={'CesiumGlobe-' + view.id}
                         debug={this.props.debugWorldView}
                         externalObjectStore={this.props.externalObjectStore}
                         selectedPlacemarkId={this.props.selectedPlacemarkId}
                         imageLayerDescriptors={descriptors.imageLayerDescriptors || EMPTY_ARRAY}
                         vectorLayerDescriptors={descriptors.vectorLayerDescriptors || EMPTY_ARRAY}
                         overlayHtml={overlayHtml}
                         splitLayerIndex={splitLayerIndex}
                         splitLayerPos={view.data.selectedLayerSplitPos}
                         onSplitLayerPosChange={this.handleSplitLayerPosChange}
                         offlineMode={this.props.offlineMode}
                         style={GlobeView.CESIUM_GLOBE_STYLE}
                         onMouseMoved={this.props.isDialogOpen ? null : this.handleMouseMoved}
                         onMouseClicked={this.props.isDialogOpen ? null : this.handleMouseClicked}
                         onLeftUp={this.props.isDialogOpen ? null : this.handleLeftUp}
                         onSelectedEntityChanged={this.handleSelectedEntityChanged}
            />
        );
    }
}

export default connect(mapStateToProps)(GlobeView);
