import * as React from 'react';
import {State, VariableState, ResourceState, LayerState, DialogState} from "../state";
import {connect} from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ListBoxSelectionMode, ListBox} from "../components/ListBox";
import {LabelWithType} from "../components/LabelWithType";
import {ModalDialog} from "../components/ModalDialog";

class LayerVariable {
    resource: ResourceState;
    variable: VariableState;
}

interface ILayerSourcesDialogProps extends DialogState {
    dispatch?: any;
    resources: ResourceState[];
    layers: LayerState[];
    layerVariables: LayerVariable[];
}

interface ILayerSourcesDialogState {
    selectedIndices: number[]|null;
}

function mapStateToProps(state: State): ILayerSourcesDialogProps {
    return {
        isOpen: selectors.dialogStateSelector(LayerSourcesDialog.DIALOG_ID)(state).isOpen,
        layers: selectors.layersSelector(state),
        resources: selectors.resourcesSelector(state),
        layerVariables: getLayerVariables(selectors.resourcesSelector(state)),
    };
}


class LayerSourcesDialog extends React.Component<ILayerSourcesDialogProps, ILayerSourcesDialogState> {
    static readonly DIALOG_ID = 'layerSourcesDialog';
    static readonly DIALOG_TITLE = 'Add Layer';

    constructor(props: ILayerSourcesDialogProps) {
        super(props);
        this.onCancel = this.onCancel.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.handleChangedVariableSelection = this.handleChangedVariableSelection.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.state = {selectedIndices: null};
    }

    private onCancel() {
        this.props.dispatch(actions.hideDialog(LayerSourcesDialog.DIALOG_ID));
    }

    private onConfirm() {
        this.props.dispatch(actions.hideDialog(LayerSourcesDialog.DIALOG_ID));
        for (let index of this.state.selectedIndices) {
            const layerVariable = this.props.layerVariables[index];
            this.props.dispatch(actions.addVariableLayer(null, layerVariable.resource, layerVariable.variable));
        }
    }

    private canConfirm(): boolean {
        return !!this.state.selectedIndices && this.state.selectedIndices.length > 0;
    }

    private handleChangedVariableSelection(newSelection: number[]) {
        this.setState({selectedIndices: newSelection.slice()});
    }

    render() {
        return (
            <ModalDialog
                isOpen={this.props.isOpen}
                title={LayerSourcesDialog.DIALOG_TITLE}
                iconName="layers"
                onCancel={this.onCancel}
                onConfirm={this.onConfirm}
                canConfirm={this.canConfirm}
                renderBody={this.renderBody}
            />
        );
    }

    private renderBody() {
        if (!this.props.layerVariables.length) {
            return (<p>There are currently no variables that could be added as layers.</p>);
        }
        return (
            <div style={{width: '100%', height: '100%', overflow: 'auto'}}>
                <p>Select the variables to wish to add as a layer:</p>
                <ListBox items={this.props.layerVariables}
                         getItemKey={LayerSourcesDialog.getVariableItemKey}
                         renderItem={LayerSourcesDialog.renderVariableItem}
                         selectionMode={ListBoxSelectionMode.MULTIPLE}
                         selection={this.state.selectedIndices}
                         onSelection={this.handleChangedVariableSelection}/>
            </div>
        );
    }

    //noinspection JSUnusedLocalSymbols
    private static getVariableItemKey(variable: LayerVariable, index: number) {
        return index;
    }

    private static renderVariableItem(layerVariable: LayerVariable) {
        const variable = layerVariable.variable;
        return (
            <div>
                <span>{layerVariable.resource.name}</span>
                <span> / </span>
                <LabelWithType label={variable.name}
                               dataType={`${variable.dataType}[${variable.dimensions}]`}
                               units={variable.units}
                />
            </div>
        );
    }
}

export default connect(mapStateToProps)(LayerSourcesDialog);


function getLayerVariables(resources: ResourceState[]) {
    const layerVariables = [];
    for (let resource of resources) {
        for (let variable of resource.variables) {
            if (actions.isSpatialImageVariable(variable) || actions.isSpatialVectorVariable(variable)) {
                layerVariables.push({resource, variable});
            }
        }
    }
    return layerVariables;
}


