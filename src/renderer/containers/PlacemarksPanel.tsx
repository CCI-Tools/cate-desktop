import * as React from 'react';
import {Button, Colors, Menu, MenuItem, Popover, Position} from "@blueprintjs/core";
import {connect, Dispatch} from 'react-redux';
import {State, PlacemarkCollection, Placemark, GeographicPosition} from "../state";
import {ListBox, ListBoxSelectionMode} from "../components/ListBox";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ContentWithDetailsPanel} from "../components/ContentWithDetailsPanel";
import LayerSourcesDialog from "./LayerSourcesDialog";
import {ScrollablePanelContent} from "../components/ScrollableContent";
import {ViewState} from "../components/ViewState";
import {NO_PLACEMARK_SELECTED, NO_PLACEMARKS} from "../messages";
import {Field, FieldValue, IFieldProps} from "../components/field/Field";
import {TextField} from "../components/field/TextField";
import {Tooltip} from "@blueprintjs/core/src/components/tooltip/tooltip";

interface IPlacemarksPanelDispatch {
    dispatch: Dispatch<State>;
}

interface IPlacemarksPanelProps {
    placemarkCollection: PlacemarkCollection;
    selectedPlacemarkId: string | null,
    selectedPlacemark: Placemark | null,
    activeView: ViewState<any> | null;
    showPlacemarkDetails: boolean,
    worldViewClickAction: string | null;
    globeViewPosition: GeographicPosition | null;
}

function mapStateToProps(state: State): IPlacemarksPanelProps {
    return {
        placemarkCollection: selectors.placemarkCollectionSelector(state),
        selectedPlacemarkId: selectors.selectedPlacemarkIdSelector(state),
        selectedPlacemark: selectors.selectedPlacemarkSelector(state),
        showPlacemarkDetails: selectors.showPlacemarkDetailsSelector(state),
        activeView: selectors.activeViewSelector(state),
        worldViewClickAction: state.control.worldViewClickAction,
        globeViewPosition: state.location.globeViewPosition,
    };
}

// Trick taken from https://github.com/Microsoft/TypeScript/issues/3960
type PositionField = new () => Field<number[], IFieldProps<number[]>>;
const PositionField = Field as any as PositionField;

/**
 * The PlacemarksPanel is used to display, select, and manage user geometries.
 *
 * @author Norman Fomferra
 */
class PlacemarksPanel extends React.Component<IPlacemarksPanelProps & IPlacemarksPanelDispatch, null> {

    constructor(props: IPlacemarksPanelProps & IPlacemarksPanelDispatch, context: any) {
        super(props, context);
        this.handleShowDetailsChanged = this.handleShowDetailsChanged.bind(this);
        this.handleAddPlacemarkFromPositionButtonClicked = this.handleAddPlacemarkFromPositionButtonClicked.bind(this);
        this.handleAddPlacemarkButtonClicked = this.handleAddPlacemarkButtonClicked.bind(this);
        this.handleRemovePlacemarkButtonClicked = this.handleRemovePlacemarkButtonClicked.bind(this);
        this.handleChangedPlacemarkVisibility = this.handleChangedPlacemarkVisibility.bind(this);
        this.handleChangedPlacemarkSelection = this.handleChangedPlacemarkSelection.bind(this);
        this.handleChangedPlacemarkName = this.handleChangedPlacemarkName.bind(this);
        this.handleChangedPlacemarkPosition = this.handleChangedPlacemarkPosition.bind(this);
        this.handleCopyName = this.handleCopyName.bind(this);
        this.handleCopyPosition = this.handleCopyPosition.bind(this);
    }

    private handleShowDetailsChanged(value: boolean) {
        this.props.dispatch(actions.updateSessionState({showPlacemarkDetails: value}));
    }

    private handleAddPlacemarkFromPositionButtonClicked() {
        this.props.dispatch(actions.updateControlState({worldViewClickAction: actions.ADD_PLACEMARK}));
    }

    private handleAddPlacemarkButtonClicked() {
        this.props.dispatch(actions.addPlacemark(this.props.globeViewPosition));
    }

    private handleRemovePlacemarkButtonClicked() {
        this.props.dispatch(actions.removePlacemark(this.props.selectedPlacemarkId));
    }

    private handleChangedPlacemarkVisibility(placemark: Placemark, visible: boolean) {
        const properties = {...placemark.properties, visible};
        this.props.dispatch(actions.updatePlacemark({...placemark, properties}));
    }

    private handleChangedPlacemarkName(name: FieldValue<string>) {
        const placemark = this.props.selectedPlacemark;
        const properties = {...placemark.properties, name: name.value};
        this.props.dispatch(actions.updatePlacemark({...placemark, properties}));
    }

    private handleChangedPlacemarkPosition(position: FieldValue<number[]>) {
        const placemark = this.props.selectedPlacemark;
        const coordinates = position.value;
        const geometry = {...placemark.geometry, coordinates};
        this.props.dispatch(actions.updatePlacemark({...placemark, geometry}));
    }

    private handleChangedPlacemarkSelection(newSelection: string[]) {
        const selectedPlacemarkId = newSelection.length ? newSelection[0] : null;
        this.props.dispatch(actions.updateSessionState({selectedPlacemarkId}));
    }

    private handleCopyName() {
        const electron = require('electron');
        const placemark = this.props.selectedPlacemark;
        electron.clipboard.writeText(placemark.properties['name']);
    }

    private handleCopyPosition() {
        const electron = require('electron');
        const placemark = this.props.selectedPlacemark;
        const position = placemark.geometry.coordinates;
        electron.clipboard.writeText(position[0] + ', ' + position[1]);
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
        const noWorldViewClickAction = !this.props.worldViewClickAction;
        const canClick = is3DViewActive && noWorldViewClickAction;
        const add1ClassName = is3DViewActive ? "pt-intent-primary" : null;
        const add2ClassName = !is3DViewActive ? "pt-intent-primary" : null;
        return (
            <div className="pt-button-group">
                <Tooltip content="Click a point on the 3D globe to add a new placemark">
                    <Button className={add1ClassName}
                            onClick={this.handleAddPlacemarkFromPositionButtonClicked}
                            iconName="pt-icon-selection"
                            disabled={!canClick}/>
                </Tooltip>
                <Button className={add2ClassName}
                        onClick={this.handleAddPlacemarkButtonClicked}
                        iconName="add"/>
                <Button disabled={!this.props.selectedPlacemarkId}
                        onClick={this.handleRemovePlacemarkButtonClicked}
                        iconName="remove"/>
                <Popover position={Position.LEFT}>
                    <Button disabled={!this.props.selectedPlacemarkId}
                            iconName="clipboard"/>
                    <Menu>
                        <MenuItem onClick={this.handleCopyName} text="Copy name"/>
                        <MenuItem onClick={this.handleCopyPosition} text="Copy position"/>
                    </Menu>
                </Popover>
                <LayerSourcesDialog/>
            </div>
        );
    }

    private renderPlacemarksList() {
        const placemarks = this.props.placemarkCollection.features;
        if (!placemarks || !placemarks.length) {
            return NO_PLACEMARKS;
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
        return <PlacemarkItem placemark={placemark} onVisibilityChange={this.handleChangedPlacemarkVisibility}/>;
    }

    private renderPlacemarkDetails() {
        const placemarks = this.props.placemarkCollection.features;
        if (!placemarks || !placemarks.length) {
            return null;
        }
        const placemark = this.props.selectedPlacemark;
        if (!placemark) {
            return NO_PLACEMARK_SELECTED;
        }
        return (
            <div style={{width: '100%'}}>
                <label key="spacer" className="pt-label"> </label>
                {this.renderPlacemarkName()}
                {this.renderPlacemarkCoordinates()}
            </div>
        );
    }

    private renderPlacemarkName() {
        const placemark = this.props.selectedPlacemark;
        const name = placemark.properties['name'];
        return (
            <label className="pt-label pt-inline">
                Name
                <span className="pt-text-muted"> (optional)</span>
                <TextField
                    cols={16}
                    value={{textValue: name, value: name}}
                    onChange={this.handleChangedPlacemarkName}
                    placeholder="Enter placemark name"
                />
            </label>
        );
    }

    private renderPlacemarkCoordinates() {
        const placemark = this.props.selectedPlacemark;
        const position = placemark.geometry.coordinates;

        const formatter = (value: number[]): string => {
            const lon = value[0];
            const lat = value[1];
            return `${lon}, ${lat}`;
        };

        const parser = (textValue: string): number[] => {
            const coordParts = textValue ? textValue.split(',') : [];
            if (coordParts.length == 2) {
                const lon = parseFloat(coordParts[0]);
                const lat = parseFloat(coordParts[1]);
                return [lon, lat];
            }
            return [parseFloat('nan'), parseFloat('nan')];
        };

        const validator = (value: number[]) => {
            const lon = value[0];
            const lat = value[1];
            if (!isNaN(lon) && !isNaN(lat)) {
                const lonOk = lon >= -180 && lon <= 180;
                const latOk = lat >= -90 && lat <= 90;
                if (!lonOk)
                    throw new Error('Longitude must be in the range -180 to +180.');
                if (!latOk)
                    throw new Error('Latitude must be in the range -90 to +90.');
            } else {
                throw new Error('Longitude, latitude pair expected.');
            }
        };

        return (
            <label className="pt-label pt-inline">
                Position
                <span className="pt-text-muted"> (in degrees)</span>
                <PositionField value={{textValue: formatter(position), value: position}}
                               onChange={this.handleChangedPlacemarkPosition}
                               cols={16}
                               placeholder="longitude, latitude"
                               validator={validator}
                               parser={parser}
                               formatter={formatter}/>
            </label>
        );
    }
}

export default connect(mapStateToProps)(PlacemarksPanel);


interface IPlacemarkItemProps {
    placemark: Placemark;
    onVisibilityChange: (placemark: Placemark, visible?) => void;
}

class PlacemarkItem extends React.PureComponent<IPlacemarkItemProps, {}> {

    static readonly ICON_STYLE = {marginLeft: "0.5em"};
    static readonly NAME_STYLE = {marginLeft: "0.5em"};
    static readonly POSITION_STYLE = {marginLeft: "0.5em", color: Colors.VIOLET5};

    constructor(props: IPlacemarkItemProps) {
        super(props);
        this.handleVisibilityChanged = this.handleVisibilityChanged.bind(this);
    }

    handleVisibilityChanged(event) {
        this.props.onVisibilityChange(this.props.placemark, event.target.checked)
    }

    public render() {
        const placemark = this.props.placemark;
        const visible = placemark.properties['visible'];
        const name = placemark.properties['name'];
        const position = placemark.geometry.coordinates;
        return (
            <div>
                <input type="checkbox"
                       checked={visible}
                       onChange={this.handleVisibilityChanged}
                />
                <span style={PlacemarkItem.ICON_STYLE} className="pt-icon-dot"/>
                <span style={PlacemarkItem.NAME_STYLE}>{name}</span>
                <span
                    style={PlacemarkItem.POSITION_STYLE}>{` ${position[0].toFixed(3)}, ${position[1].toFixed(3)}`}</span>
            </div>
        );
    }
}


// TODO (forman): The following didn't compile with TS 2.2, gives weird compoiler errors which I couldn't resolve:
// > cate-desktop@0.8.0-rc.6.dev.1 compile C:\Users\norma\WebstormProjects\cate-desktop
// > tsc
//
// node_modules/@blueprintjs/core/src/common/abstractComponent.ts(46,30): error TS2345: Argument of type 'Timer' is not assignable to parameter of type 'number'.
// node_modules/@blueprintjs/core/src/components/overlay/overlay.tsx(301,55): error TS2339: Property 'query' does not exist on type 'HTMLElement'.
// node_modules/@blueprintjs/core/src/components/overlay/overlay.tsx(302,53): error TS2339: Property 'query' does not exist on type 'HTMLElement'.
//
// see also https://github.com/WebReflection/dom4
//
/*
 @ContextMenuTarget
 class PlacemarkItem extends React.PureComponent<IPlacemarkItemProps, {}> {

 static readonly ICON_STYLE = {marginLeft: "0.5em"};
 static readonly NAME_STYLE = {marginLeft: "0.5em"};
 static readonly POSITION_STYLE = {marginLeft: "0.5em", color: Colors.VIOLET5};

 constructor(props: IPlacemarkItemProps) {
 super(props);
 this.handleVisibilityChanged = this.handleVisibilityChanged.bind(this);
 }

 handleCopyName() {
 const electron = require('electron');
 const placemark = this.props.placemark;
 electron.clipboard.writeText(placemark.properties['name']);
 }

 handleCopyPosition() {
 const electron = require('electron');
 const placemark = this.props.placemark;
 const position = placemark.geometry.coordinates;
 electron.clipboard.writeText(position[0] + ', ' + position[1]);
 }

 handleVisibilityChanged(event) {
 this.props.onVisibilityChange(this.props.placemark, event.target.checked)
 }

 public render() {
 const placemark = this.props.placemark;
 const visible = placemark.properties['visible'];
 const name = placemark.properties['name'];
 const position = placemark.geometry.coordinates;
 return (
 <div>
 <input type="checkbox"
 checked={visible}
 onChange={this.handleVisibilityChanged}
 />
 <span style={PlacemarkItem.ICON_STYLE} className="pt-icon-dot"/>
 <span style={PlacemarkItem.NAME_STYLE}>{name}</span>
 <span style={PlacemarkItem.POSITION_STYLE}>{` ${position[0].toFixed(3)}, ${position[1].toFixed(3)}`}</span>
 </div>
 );
 }

 //noinspection JSUnusedGlobalSymbols
 renderContextMenu() {
 // return a single element, or nothing to use default browser behavior
 return (
 <Menu>
 <MenuItem onClick={this.handleCopyName} text="Copy name"/>
 <MenuItem onClick={this.handleCopyPosition} text="Copy position"/>
 </Menu>
 );
 }

 //noinspection JSUnusedGlobalSymbols
 onContextMenuClose() {
 // Optional method called once the context menu is closed.
 }
 }
 */
