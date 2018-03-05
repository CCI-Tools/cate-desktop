import * as React from 'react';
import {AnchorButton, Colors, ContextMenuTarget, Menu, MenuItem, Popover, Position, Tooltip} from "@blueprintjs/core";
import {connect, Dispatch} from 'react-redux';
import {State, PlacemarkCollection, Placemark, GeographicPosition} from "../state";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import LayerSourcesDialog from "./LayerSourcesDialog";
import {ScrollablePanelContent} from "../components/ScrollableContent";
import {ViewState} from "../components/ViewState";
import {NO_PLACE_SELECTED, NO_PLACES} from "../messages";
import {Field, FieldType, FieldValue, IFieldProps} from "../components/field/Field";
import {TextField} from "../components/field/TextField";
import {parseNumericPair} from "../components/field/NumericRangeField";
import {isBox, validateGeoCoordinate} from "../../common/geometry-util";
import {GeometryToolType} from "../components/cesium/geometry-tool";

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

type GeographicPositionFieldType = FieldType<GeographicPosition>;
type GeographicPositionFieldValue = FieldValue<GeographicPosition>;

class GeographicPositionField extends Field<IFieldProps> {

    parseValue(textValue: string): GeographicPositionFieldType {
        const pair = parseNumericPair(textValue);
        if (!pair) {
            throw Error("Longitude, latitude pair in degrees expected");
        }
        return {longitude: pair[0], latitude: pair[1]};
    }

    formatValue(value: GeographicPositionFieldType): string {
        return `${value.longitude}, ${value.latitude}`;
    }

    validateValue(value: GeographicPositionFieldType): void {
        super.validateValue(value);
        validateGeoCoordinate(value.longitude, value.latitude);
    }
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
        this.handleChangedPlacemarkPosition = this.handleChangedPlacemarkPosition.bind(this);
        this.handleCopySelectedName = this.handleCopySelectedName.bind(this);
        this.handleCopySelectedPosition = this.handleCopySelectedPosition.bind(this);
        this.handleCopySelectedPositionKW = this.handleCopySelectedPositionKW.bind(this);
        this.handleCopySelectedPositionWKT = this.handleCopySelectedPositionWKT.bind(this);
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

    private handleChangedPlacemarkPosition(position: GeographicPositionFieldValue) {
        const placemark = this.props.selectedPlacemark;
        const lonLat = position.value;
        const geometry = {...placemark.geometry, coordinates: [lonLat.longitude, lonLat.latitude]};
        this.props.dispatch(actions.updatePlacemarkGeometry(placemark.id, geometry));
    }

    private handleChangedPlacemarkSelection(newSelection: string[]) {
        const selectedPlacemarkId = newSelection.length ? newSelection[0] : null;
        this.props.dispatch(actions.setSelectedPlacemarkId(selectedPlacemarkId));
    }

    private handleCopySelectedName() {
        PlacemarksPanel.handleCopyTitle(this.props.selectedPlacemark);
    }

    private handleCopySelectedPosition() {
        PlacemarksPanel.handleCopyPosition(this.props.selectedPlacemark);
    }

    private handleCopySelectedPositionKW() {
        PlacemarksPanel.handleCopyPositionKW(this.props.selectedPlacemark);
    }

    private handleCopySelectedPositionWKT() {
        PlacemarksPanel.handleCopyPositionWKT(this.props.selectedPlacemark);
    }

    private static handleCopyTitle(placemark: Placemark) {
        const electron = require('electron');
        const text = placemark.properties['title'];
        electron.clipboard.writeText(text);
        // console.log(`copied to clipboard [${text}]`);
    }

    private static handleCopyPosition(placemark: Placemark) {
        const position = placemark.geometry.coordinates;
        actions.copyTextToClipboard(`${position[0]}, ${position[1]}`);
    }

    private static handleCopyPositionKW(placemark: Placemark) {
        const position = placemark.geometry.coordinates;
        actions.copyTextToClipboard(`lon=${position[0]}, lat=${position[1]}`);
    }

    private static handleCopyPositionWKT(placemark: Placemark) {
        const position = placemark.geometry.coordinates;
        actions.copyTextToClipboard(`POINT (${position[0]} ${position[1]})`);
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
        const is3DViewActive = this.props.activeView && this.props.activeView.type === 'world' && this.props.activeView.data.viewMode === "3D";
        const add2ClassName = !is3DViewActive ? "pt-intent-primary" : null;
        const isPointToolActive = this.props.geometryToolType === "PointTool";
        const isPolylineToolActive = this.props.geometryToolType === "PolylineTool";
        const isPolygonToolActive = this.props.geometryToolType === "PolygonTool";
        const isBoxToolActive = this.props.geometryToolType === "BoxTool";
        return (
            <div className="pt-button-group">
                <Tooltip content="New point" position={Position.LEFT}>
                    <AnchorButton className={add2ClassName}
                                  onClick={this.handleNewPointToolButtonClicked}
                                  iconName="dot"
                                  active={isPointToolActive}
                                  disabled={false}
                    />
                </Tooltip>
                <Tooltip content="New point" position={Position.LEFT}>
                    <AnchorButton className={add2ClassName}
                                  onClick={this.handleNewPolylineToolButtonClicked}
                                  iconName="slash"
                                  active={isPolylineToolActive}
                                  disabled={false}
                    />
                </Tooltip>
                <Tooltip content="New point" position={Position.LEFT}>
                    <AnchorButton className={add2ClassName}
                                  onClick={this.handleNewPolygonToolButtonClicked}
                                  iconName="polygon-filter"
                                  active={isPolygonToolActive}
                                  disabled={false}
                    />
                </Tooltip>
                <Tooltip content="New point" position={Position.LEFT}>
                    <AnchorButton className={add2ClassName}
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

                <Tooltip content="Locate selected placemark in view" position={Position.LEFT}>
                    <AnchorButton disabled={!this.props.selectedPlacemarkId}
                                  onClick={this.handleLocatePlacemarkButtonClicked}
                                  iconName="locate"/>
                </Tooltip>

                <Popover position={Position.LEFT}>
                    <AnchorButton disabled={!this.props.selectedPlacemarkId}
                                  iconName="clipboard"/>
                    <Menu>
                        <MenuItem onClick={this.handleCopySelectedName} text="Copy Name"/>
                        <MenuItem onClick={this.handleCopySelectedPosition} text="Copy Position"/>
                        <MenuItem onClick={this.handleCopySelectedPositionKW} text="Copy Position with Keywords"/>
                        <MenuItem onClick={this.handleCopySelectedPositionWKT} text="Copy Position as WKT"/>
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
                              onCopyName={PlacemarksPanel.handleCopyTitle}
                              onCopyPosition={PlacemarksPanel.handleCopyPosition}
                              onCopyPositionKW={PlacemarksPanel.handleCopyPositionKW}
                              onCopyPositionWKT={PlacemarksPanel.handleCopyPositionWKT}
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
                <label className="pt-label pt-inline">
                    Position
                    <span className="pt-text-muted"> (in degrees)</span>
                    <GeographicPositionField value={{longitude: position[0], latitude: position[1]}}
                                             onChange={this.handleChangedPlacemarkPosition}
                                             size={16}
                                             uncontrolled={true}
                                             placeholder="Enter longitude, latitude"/>
                </label>
            );
        }
        return null;
    }
}

export default connect(mapStateToProps)(PlacemarksPanel);


interface IPlacemarkItemProps {
    placemark: Placemark;
    onVisibilityChange: (placemark: Placemark, visible?) => void;
    onCopyName: (placemark: Placemark) => void;
    onCopyPosition: (placemark: Placemark) => void;
    onCopyPositionKW: (placemark: Placemark) => void;
    onCopyPositionWKT: (placemark: Placemark) => void;
}

@ContextMenuTarget
class PlacemarkItem extends React.PureComponent<IPlacemarkItemProps, {}> {

    static readonly ICON_STYLE = {marginLeft: "0.5em"};
    static readonly NAME_STYLE = {marginLeft: "0.5em"};
    static readonly INFO_STYLE = {float: "right", color: Colors.BLUE5};

    constructor(props: IPlacemarkItemProps) {
        super(props);
        this.handleVisibilityChanged = this.handleVisibilityChanged.bind(this);
        this.handleCopyName = this.handleCopyName.bind(this);
        this.handleCopyPosition = this.handleCopyPosition.bind(this);
        this.handleCopyPositionKW = this.handleCopyPositionKW.bind(this);
        this.handleCopyPositionWKT = this.handleCopyPositionWKT.bind(this);
    }

    handleCopyName() {
        this.props.onCopyName(this.props.placemark);
    }

    handleCopyPosition() {
        this.props.onCopyPosition(this.props.placemark);
    }

    handleCopyPositionKW() {
        this.props.onCopyPositionKW(this.props.placemark);
    }

    handleCopyPositionWKT() {
        this.props.onCopyPositionWKT(this.props.placemark);
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
        } else if (geometry.type === "Polyline") {
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
                       checked={visible}
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
                <MenuItem onClick={this.handleCopyName} text="Copy Name"/>
                <MenuItem onClick={this.handleCopyPosition} text="Copy Position"/>
                <MenuItem onClick={this.handleCopyPositionKW} text="Copy Position with Keywords"/>
                <MenuItem onClick={this.handleCopyPositionWKT} text="Copy Position as WKT"/>
            </Menu>
        );
    }

    //noinspection JSUnusedGlobalSymbols
    onContextMenuClose() {
        // Optional method called once the context menu is closed.
    }
}

