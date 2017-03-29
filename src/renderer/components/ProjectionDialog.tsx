import * as React from 'react';
import {ListBoxSelectionMode, ListBox} from "./ListBox";
import {ModalDialog} from "./ModalDialog";
import {getProjection, getProjectionCodes} from "../../common/projection-util";
import * as ol from 'openlayers';
import * as proj4 from 'proj4';

ol.proj.setProj4(proj4);

interface IProjectionDialogProps {
    isOpen: boolean;
    projectionCode: string;
    onConfirm: (projectionCode: string) => void;
    onCancel: () => void;
}

interface IProjectionDialogState {
    projectionCode: string|null;
}

export class ProjectionDialog extends React.Component<IProjectionDialogProps, IProjectionDialogState> {
    static readonly DIALOG_ID = 'projectionsDialog';
    static readonly DIALOG_TITLE = 'Select Map Projection';

    constructor(props: IProjectionDialogProps) {
        super(props);
        this.canConfirm = this.canConfirm.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.onProjectionCodeChange = this.onProjectionCodeChange.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.state = {projectionCode: props.projectionCode};
    }

    private onConfirm() {
        this.props.onConfirm(this.state.projectionCode);
    }

    private canConfirm(): boolean {
        return !!this.state.projectionCode;
    }

    private onProjectionCodeChange(newSelection: string[]) {
        this.setState({projectionCode: newSelection && newSelection[0]});
    }

    render() {
        return (
            <ModalDialog
                isOpen={this.props.isOpen}
                iconName="globe"
                title={ProjectionDialog.DIALOG_TITLE}
                onCancel={this.props.onCancel}
                onConfirm={this.onConfirm}
                canConfirm={this.canConfirm}
                renderBody={this.renderBody}
            />
        );
    }

    private renderBody() {
        if (!this.props.isOpen) {
            return null;
        }
        return (
            <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                <p>Select the variables to wish to add as a layer:</p>
                <ListBox items={getProjectionCodes()}
                         getItemKey={ProjectionDialog.getProjectionKey}
                         renderItem={ProjectionDialog.renderProjectionItem}
                         selectionMode={ListBoxSelectionMode.SINGLE}
                         selection={this.state.projectionCode}
                         onSelection={this.onProjectionCodeChange}/>
            </div>
        );
    }

    private static renderProjectionItem(projectionCode: string) {
        const projection = getProjection(projectionCode);
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

