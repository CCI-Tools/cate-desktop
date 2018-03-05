import * as React from 'react';
import {
    AnchorButton, Colors, ContextMenuTarget, Menu, MenuItem, Popover, Position,
    Tooltip
} from "@blueprintjs/core";
import {connect, Dispatch} from 'react-redux';
import {State, PlacemarkCollection, Placemark} from "../state";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import LayerSourcesDialog from "./LayerSourcesDialog";
import {ScrollablePanelContent} from "../components/ScrollableContent";
import {ViewState} from "../components/ViewState";
import {NO_PLACE_SELECTED, NO_PLACES} from "../messages";
import {FieldValue} from "../components/field/Field";
import {TextField} from "../components/field/TextField";
import {geometryGeoJSONToGeometryWKT, isBox} from "../../common/geometry-util";
import {GeometryToolType} from "../components/cesium/geometry-tool";
import {isBoolean} from "../../common/types";
import {NumericField, NumericFieldValue} from "../components/field/NumericField";

interface IPlacemarksPanelDispatch {
    dispatch: Dispatch<State>;
}

interface IPlacemarksPanelProps {
    placemarkCollection: PlacemarkCollection;
    selectedPlacemarkId: string | null,
    selectedPlacemark: Placemark | null,
    activeView: ViewState<any> | null;
    showPlacemarkDetails: boolean,
    geometryToolType: GeometryToolType;
}

function mapStateToProps(state: State): IPlacemarksPanelProps {
    return {
        placemarkCollection: selectors.placemarkCollectionSelector(state),
        selectedPlacemarkId: selectors.selectedPlacemarkIdSelector(state),
        selectedPlacemark: selectors.selectedPlacemarkSelector(state),
        showPlacemarkDetails: selectors.showPlacemarkDetailsSelector(state),
        activeView: selectors.activeViewSelector(state),
        geometryToolType: selectors.newPlacemarkToolTypeSelector(state),
    };
}


/**
 * The PlacemarksPanel is used to display, select, and manage user geometries.
 *
 * @author Norman Fomferra
 */
class PlacemarksPanel extends React.Component<IPlacemarksPanelProps & IPlacemarksPanelDispatch, null> {

    constructor(props: IPlacemarksPanelProps & IPlacemarksPanelDispatch) {
        super(props);
        this.handleShowDetailsChanged = this.handleShowDetailsChanged.bind(this);
        this.handleNewPointToolButtonClicked = this.handleNewPointToolButtonClicked.bind(this);
        this.handleNewPolygonToolButtonClicked = this.handleNewPolygonToolButtonClicked.bind(this);
        this.handleNewPolylineToolButtonClicked = this.handleNewPolylineToolButtonClicked.bind(this);
        this.handleNewBoxToolButtonClicked = this.handleNewBoxToolButtonClicked.bind(this);
        this.handleRemovePlacemarkButtonClicked = this.handleRemovePlacemarkButtonClicked.bind(this);
        this.handleLocatePlacemarkButtonClicked = this.handleLocatePlacemarkButtonClicked.bind(this);
        this.handleChangedPlacemarkVisibility = this.handleChangedPlacemarkVisibility.bind(this);
        this.handleChangedPlacemarkSelection = this.handleChangedPlacemarkSelection.bind(this);
        this.handleChangedPlacemarkName = this.handleChangedPlacemarkName.bind(this);
        this.handleChangedPointLongitude = this.handleChangedPointLongitude.bind(this);
        this.handleChangedPointLatitude = this.handleChangedPointLatitude.bind(this);
        this.handleCopySelectedPositionText = this.handleCopySelectedPositionText.bind(this);
        this.handleCopySelectedPositionWKT = this.handleCopySelectedPositionWKT.bind(this);
        this.handleCopySelectedPositionGeoJSON = this.handleCopySelectedPositionGeoJSON.bind(this);
        this.renderPlacemarkItem = this.renderPlacemarkItem.bind(this);
    }

    private handleNewPointToolButtonClicked() {
        this.props.dispatch(actions.activateNewPlacemarkTool("PointTool"));
    }

    private handleNewPolygonToolButtonClicked() {
        this.props.dispatch(actions.activateNewPlacemarkTool("PolygonTool"));
    }

    private handleNewPolylineToolButtonClicked() {
        this.props.dispatch(actions.activateNewPlacemarkTool("PolylineTool"));
    }

    private handleNewBoxToolButtonClicked() {
        this.props.dispatch(actions.activateNewPlacemarkTool("BoxTool"));
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.dispatch(actions.updateSessionState({showPlacemarkDetails: value}));
    }

    private handleRemovePlacemarkButtonClicked() {
        this.props.dispatch(actions.removePlacemark(this.props.selectedPlacemarkId));
    }

    private handleLocatePlacemarkButtonClicked() {
        this.props.dispatch(actions.locatePlacemark(this.props.selectedPlacemarkId));
    }

    private handleChangedPlacemarkVisibility(placemark: Placemark, visible: boolean) {
        this.props.dispatch(actions.updatePlacemarkProperties(placemark.id, {visible}));
    }

    private handleChangedPlacemarkName(nameField: FieldValue<string>) {
        const placemark = this.props.selectedPlacemark;
        const name = nameField.value;
        this.props.dispatch(actions.updatePlacemarkStyle(placemark.id, {title: name}));
    }

    private handleChangedPointLongitude(longitude: NumericFieldValue) {
        const placemark = this.props.selectedPlacemark;
        let geometry = placemark.geometry;
        geometry = {...geometry, coordinates: [longitude.value, geometry.coordinates[1]]};
        this.props.dispatch(actions.updatePlacemarkGeometry(placemark.id, geometry));
    }

    private handleChangedPointLatitude(latitude: NumericFieldValue) {
        const placemark = this.props.selectedPlacemark;
        let geometry = placemark.geometry;
        geometry = {...geometry, coordinates: [geometry.coordinates[1], latitude.value]};
        this.props.dispatch(actions.updatePlacemarkGeometry(placemark.id, geometry));
    }

    private handleChangedPlacemarkSelection(newSelection: string[]) {
        const selectedPlacemarkId = newSelection.length ? newSelection[0] : null;
        this.props.dispatch(actions.setSelectedPlacemarkId(selectedPlacemarkId));
    }

    private handleCopySelectedPositionText() {
        PlacemarksPanel.handleCopyPositionText(this.props.selectedPlacemark);
    }

    private handleCopySelectedPositionWKT() {
        PlacemarksPanel.handleCopyPositionGeoJSON(this.props.selectedPlacemark);
    }

    private handleCopySelectedPositionGeoJSON() {
        PlacemarksPanel.handleCopyPositionGeoJSON(this.props.selectedPlacemark);
    }

    private static handleCopyPositionText(placemark: Placemark) {
        // TODO (nf): handle other geometry types
        if (placemark.geometry.type === "Point") {
            const position = placemark.geometry.coordinates;
            actions.copyTextToClipboard(`${position[0]}, ${position[1]}`);
        }
    }

    private static handleCopyPositionWKT(placemark: Placemark) {
        actions.copyTextToClipboard(geometryGeoJSONToGeometryWKT(placemark.geometry));
    }

    private static handleCopyPositionGeoJSON(placemark: Placemark) {
        actions.copyTextToClipboard(JSON.stringify(placemark));
    }

    private static getPlacemarkItemKey(placemark: Placemark) {
        return placemark.id;
    }

    render() {
        return (
            <div style={{width: '100%'}}>
                <ContentWithDetailsPanel showDetails={this.props.showPlacemarkDetails}
                                         onShowDetailsChange={this.handleShowDetailsChanged}
                                         isSplitPanel={true}
                                         initialContentHeight={160}
                                         actionComponent={this.renderActionButtonRow()}>
                    {this.renderPlacemarksList()}
                    {this.renderPlacemarkDetails()}
                </ContentWithDetailsPanel>
            </div>
        );
    }

    private renderActionButtonRow() {
        const isViewActive = this.props.activeView && this.props.activeView.type === 'world' && this.props.activeView.data.viewMode === "3D";
        const toolClassName = isViewActive ? "pt-intent-primary" : null;
        const isPointToolActive = this.props.geometryToolType === "PointTool";
        const isPolylineToolActive = this.props.geometryToolType === "PolylineTool";
        const isPolygonToolActive = this.props.geometryToolType === "PolygonTool";
        const isBoxToolActive = this.props.geometryToolType === "BoxTool";
        return (
            <div className="pt-button-group">
                <Tooltip content="New point" position={Position.LEFT}>
                    <AnchorButton className={toolClassName}
                                  onClick={this.handleNewPointToolButtonClicked}
                                  iconName="dot"
                                  active={isPointToolActive}
                                  disabled={false}
                    />
                </Tooltip>
                <Tooltip content="New point" position={Position.LEFT}>
                    <AnchorButton className={toolClassName}
                                  onClick={this.handleNewPolylineToolButtonClicked}
                                  iconName="slash"
                                  active={isPolylineToolActive}
                                  disabled={false}
                    />
                </Tooltip>
                <Tooltip content="New point" position={Position.LEFT}>
                    <AnchorButton className={toolClassName}
                                  onClick={this.handleNewPolygonToolButtonClicked}
                                  iconName="polygon-filter"
                                  active={isPolygonToolActive}
                                  disabled={false}
                    />
                </Tooltip>
                <Tooltip content="New point" position={Position.LEFT}>
                    <AnchorButton className={toolClassName}
                                  onClick={this.handleNewBoxToolButtonClicked}
                                  iconName="widget"
                                  active={isBoxToolActive}
                                  disabled={false}
                    />
                </Tooltip>


                <Tooltip content="Remove selected placemark" position={Position.LEFT}>
                    <AnchorButton disabled={!this.props.selectedPlacemarkId}
                                  onClick={this.handleRemovePlacemarkButtonClicked}
                                  iconName="remove"/>
                </Tooltip>

                {/*<Tooltip content="Locate selected placemark in view" position={Position.LEFT}>*/}
                {/*<AnchorButton disabled={!this.props.selectedPlacemarkId}*/}
                {/*onClick={this.handleLocatePlacemarkButtonClicked}*/}
                {/*iconName="locate"/>*/}
                {/*</Tooltip>*/}

                <Popover position={Position.LEFT}>
                    <AnchorButton disabled={!this.props.selectedPlacemarkId}
                                  iconName="clipboard"/>
                    <Menu>
                        <MenuItem onClick={this.handleCopySelectedPositionText} text="Copy as text"/>
                        <MenuItem onClick={this.handleCopySelectedPositionWKT} text="Copy as WKT"/>
                        <MenuItem onClick={this.handleCopySelectedPositionGeoJSON} text="Copy as GeoJSON"/>
                    </Menu>
                </Popover>
                <LayerSourcesDialog/>
            </div>
        );
    }

    private renderPlacemarksList() {
        const placemarks = this.props.placemarkCollection.features;
        if (!placemarks || !placemarks.length) {
            return NO_PLACES;
        }

        return (
            <ScrollablePanelContent>
                <ListBox items={placemarks}
                         getItemKey={PlacemarksPanel.getPlacemarkItemKey}
                         renderItem={this.renderPlacemarkItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={this.props.selectedPlacemarkId}
                         onSelection={this.handleChangedPlacemarkSelection}/>
            </ScrollablePanelContent>
        );
    }

    private renderPlacemarkItem(placemark: Placemark) {
        return <PlacemarkItem placemark={placemark}
                              onVisibilityChange={this.handleChangedPlacemarkVisibility}
                              onCopyPositionText={PlacemarksPanel.handleCopyPositionText}
                              onCopyPositionWKT={PlacemarksPanel.handleCopyPositionWKT}
                              onCopyPositionGeoJSON={PlacemarksPanel.handleCopyPositionGeoJSON}
        />;
    }

    private renderPlacemarkDetails() {
        const placemarks = this.props.placemarkCollection.features;
        if (!placemarks || !placemarks.length) {
            return null;
        }
        const placemark = this.props.selectedPlacemark;
        if (!placemark) {
            return NO_PLACE_SELECTED;
        }
        return (
            <div style={{width: '100%'}}>
                <label key="spacer" className="pt-label"> </label>
                {this.renderPlacemarkTitle()}
                {this.renderPlacemarkGeometry()}
            </div>
        );
    }

    private renderPlacemarkTitle() {
        const placemark = this.props.selectedPlacemark;
        const name = placemark.properties['title'];
        return (
            <label className="pt-label pt-inline">
                Name
                <span className="pt-text-muted"> (optional)</span>
                <TextField value={{textValue: name, value: name}}
                           onChange={this.handleChangedPlacemarkName}
                           size={16}
                           uncontrolled={true}
                           placeholder="Placemark name"
                />
            </label>
        );
    }

    private renderPlacemarkGeometry() {
        const placemark = this.props.selectedPlacemark;
        const geometry = placemark.geometry;
        if (geometry.type === "Point") {
            const position = geometry.coordinates;
            return (
                <div>
                    <label className="pt-label pt-inline">
                        Longitude
                        <span className="pt-text-muted"> (in degrees)</span>
                        <NumericField value={position[0]}
                                      onChange={this.handleChangedPointLongitude}
                                      size={12}
                                      uncontrolled={true}
                                      min={-180}
                                      max={+180}
                                      placeholder="Longitude in degrees"/>
                    </label>
                    <label className="pt-label pt-inline">
                        Latitude
                        <span className="pt-text-muted"> (in degrees)</span>
                        <NumericField value={position[1]}
                                      onChange={this.handleChangedPointLatitude}
                                      size={12}
                                      uncontrolled={true}
                                      min={-90}
                                      max={+90}
                                      placeholder="Latitude in degrees"/>
                    </label>
                </div>
            );
        } else if (isBox(geometry)) {
            // TODO (nf): allow editing box coordinates
        }
        return null;
    }
}

export default connect(mapStateToProps)(PlacemarksPanel);


interface IPlacemarkItemProps {
    placemark: Placemark;
    onVisibilityChange: (placemark: Placemark, visible?) => void;
    onCopyPositionText: (placemark: Placemark) => void;
    onCopyPositionWKT: (placemark: Placemark) => void;
    onCopyPositionGeoJSON: (placemark: Placemark) => void;
}

@ContextMenuTarget
class PlacemarkItem extends React.PureComponent<IPlacemarkItemProps, {}> {

    static readonly ICON_STYLE = {marginLeft: "0.5em"};
    static readonly NAME_STYLE = {marginLeft: "0.5em"};
    static readonly INFO_STYLE = {float: "right", color: Colors.BLUE5};

    constructor(props: IPlacemarkItemProps) {
        super(props);
        this.handleVisibilityChanged = this.handleVisibilityChanged.bind(this);
        this.handleCopyPositionText = this.handleCopyPositionText.bind(this);
        this.handleCopyPositionWKT = this.handleCopyPositionWKT.bind(this);
        this.handleCopyPositionGeoJSON = this.handleCopyPositionGeoJSON.bind(this);
    }

    handleCopyPositionText() {
        this.props.onCopyPositionText(this.props.placemark);
    }

    handleCopyPositionWKT() {
        this.props.onCopyPositionWKT(this.props.placemark);
    }

    handleCopyPositionGeoJSON() {
        this.props.onCopyPositionGeoJSON(this.props.placemark);
    }

    handleVisibilityChanged(event) {
        this.props.onVisibilityChange(this.props.placemark, event.target.checked)
    }

    public render() {
        const placemark = this.props.placemark;
        const visible = placemark.properties['visible'];
        const title = placemark.properties['title'];
        const geometry = placemark.geometry;
        let icon;
        let info;
        if (geometry.type === "Point") {
            const position = geometry.coordinates;
            info = ` ${position[0].toFixed(3)}, ${position[1].toFixed(3)}`;
            icon = "pt-icon-dot";
        } else if (geometry.type === "LineString") {
            const coordinates = geometry.coordinates;
            info = ` ${coordinates.length} points`;
            icon = "pt-icon-slash";
        } else if (geometry.type === "Polygon") {
            const ring = geometry.coordinates[0] as any;
            info = ` ${ring.length - 1} points`;
            icon = isBox(geometry) ? "pt-icon-widget" : "pt-icon-polygon-filter";
        }

        return (
            <div>
                <input type="checkbox"
                       checked={isBoolean(visible) ? visible : true}
                       onChange={this.handleVisibilityChanged}
                />
                <span style={PlacemarkItem.ICON_STYLE} className={icon}/>
                <span style={PlacemarkItem.NAME_STYLE}>{title}</span>
                <span style={PlacemarkItem.INFO_STYLE}>{info}</span>
            </div>
        );
    }

    //noinspection JSUnusedGlobalSymbols
    renderContextMenu() {
        // return a single element, or nothing to use default browser behavior
        return (
            <Menu>
                <MenuItem onClick={this.handleCopyPositionText} text="Copy as Text"/>
                <MenuItem onClick={this.handleCopyPositionWKT} text="Copy as WKT"/>
                <MenuItem onClick={this.handleCopyPositionGeoJSON} text="Copy as GeoJSON"/>
            </Menu>
        );
    }

    //noinspection JSUnusedGlobalSymbols
    onContextMenuClose() {
        // Optional method called once the context menu is closed.
    }
}

