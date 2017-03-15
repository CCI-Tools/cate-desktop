import * as React from 'react';
import {State, ResourceState, LayerState, DialogState} from "../state";
import {connect} from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ListBoxSelectionMode, ListBox} from "../components/ListBox";
import {ModalDialog} from "../components/ModalDialog";
import * as ol from 'openlayers';
import * as proj4 from 'proj4';

ol.proj.setProj4(proj4);

interface IProjectionsDialogProps extends DialogState {
    dispatch?: any;
    resources: ResourceState[];
    layers: LayerState[];
    projectionCode: string;
}

interface IProjectionsDialogState {
    projectionCode: string|null;
}

function mapStateToProps(state: State): IProjectionsDialogProps {
    return {
        isOpen: selectors.dialogStateSelector(ProjectionsDialog.DIALOG_ID)(state).isOpen,
        layers: selectors.layersSelector(state),
        resources: selectors.resourcesSelector(state),
        projectionCode: state.control.projectionCode,
    };
}

class ProjectionsDialog extends React.Component<IProjectionsDialogProps, IProjectionsDialogState> {
    static readonly DIALOG_ID = 'projectionsDialog';
    static readonly DIALOG_TITLE = 'Select Map Projection';

    constructor(props: IProjectionsDialogProps) {
        super(props);
        this.onConfirm = this.onConfirm.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.handleChangedProjectionSelection = this.handleChangedProjectionSelection.bind(this);
        this.state = {projectionCode: props.projectionCode};
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(ProjectionsDialog.DIALOG_ID));
        if (this.state.projectionCode) {
            this.props.dispatch(actions.setControlProperty('projectionCode', this.state.projectionCode));
        }
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(ProjectionsDialog.DIALOG_ID));
    }

    private handleChangedProjectionSelection(newSelection: string[]) {
        this.setState({projectionCode: newSelection && newSelection[0]});
    }

    private canConfirm() {
        return !!this.state.projectionCode;
    }

    render() {
        return (
            <ModalDialog
                isOpen={this.props.isOpen}
                iconName="confirm"
                title={ProjectionsDialog.DIALOG_TITLE}
                onConfirm={this.onConfirm}
                onCancel={this.onCancel}
                renderBody={this.renderBody}
                canConfirm={this.canConfirm}
            />
        );
    }

    private renderBody() {
        return (
            <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                <p>Select the variables to wish to add as a layer:</p>
                <ListBox items={projections}
                         getItemKey={ProjectionsDialog.getProjectionKey}
                         renderItem={ProjectionsDialog.renderProjectionItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={this.state.projectionCode}
                         onSelection={this.handleChangedProjectionSelection}/>
            </div>
        );
    }

    private static renderProjectionItem(projectionCode: string) {
        const projection = proj4.defs[projectionCode];

        return (
            <div>
                {projectionCode}
                <span style={{color: '#62D96B'}}>{` ${projection.title}`}</span>
                <span style={{color: '#CED9E0'}}>{` units: ${projection.units}`}</span>
            </div>
        );
    }

    private static getProjectionKey(projectionCode: string) {
        return projectionCode;
    }
}

export default connect(mapStateToProps)(ProjectionsDialog);


function getProjections() {
    // EPSG:4326 is default
    // EPSG:3857 is default
    proj4.defs('Glaciers_CCI_Greenland', "+title=Glacier CCI Greenland +proj=laea +datum=WGS84 +lon_0=-43 +lat_0=90 +x_0=0 +y_0=0 +units=m +no_defs");
    proj4.defs("EPSG:3411", "+title=NSIDC Sea Ice Polar Stereographic North +proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +a=6378273 +b=6356889.449 +units=m +no_defs");
    proj4.defs("EPSG:3412", "+title=NSIDC Sea Ice Polar Stereographic South +proj=stere +lat_0=-90 +lat_ts=-70 +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=6378273 +b=6356889.449 +units=m +no_defs");
    proj4.defs('EPSG:3413', "+title=WGS 84 / NSIDC Sea Ice Polar Stereographic North +proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");
    proj4.defs("EPSG:3395", "+title=WGS 84 / World Mercator +proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs");
    proj4.defs("EPSG:3408", "+title=NSIDC EASE-Grid North +proj=laea +lat_0=90 +lon_0=0 +x_0=0 +y_0=0 +a=6371228 +b=6371228 +units=m +no_defs");
    proj4.defs("EPSG:3409", "+title=NSIDC EASE-Grid South +proj=laea +lat_0=-90 +lon_0=0 +x_0=0 +y_0=0 +a=6371228 +b=6371228 +units=m +no_defs");
    proj4.defs("EPSG:3410", "+title=NSIDC EASE-Grid Global +proj=cea +lon_0=0 +lat_ts=30 +x_0=0 +y_0=0 +a=6371228 +b=6371228 +units=m +no_defs");

    const keys = [];
    for (let key of Object.keys(proj4.defs)) {
        console.log('proj4: ', key, proj4.defs[key]);
        console.log('ol.proj: ', key, ol.proj.get(key));
        keys.push(key);
    }
    return keys;
}

const projections = getProjections();
