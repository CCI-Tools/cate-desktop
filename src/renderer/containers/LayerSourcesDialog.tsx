import * as React from 'react';
import {Dialog, Classes, Button} from "@blueprintjs/core";
import {State, VariableState, ResourceState, LayerState} from "../state";
import {connect} from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ListBoxSelectionMode, ListBox} from "../components/ListBox";
import {LabelWithType} from "../components/LabelWithType";

class LayerVariable {
    resource: ResourceState;
    variable: VariableState;
}

interface ILayerSourcesDialogProps {
    dispatch?: any;
    isOpen: boolean;
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
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleChangedVariableSelection = this.handleChangedVariableSelection.bind(this);
        this.state = {selectedIndices: null};
    }

    private handleConfirm() {
        this.props.dispatch(actions.updateDialogState(LayerSourcesDialog.DIALOG_ID, {isOpen: false}));
        for (let index of this.state.selectedIndices) {
            const layerVariable = this.props.layerVariables[index];
            this.props.dispatch(actions.addVariableLayer(null, layerVariable.resource, layerVariable.variable));
        }
    }

    private handleCancel() {
        this.props.dispatch(actions.updateDialogState(LayerSourcesDialog.DIALOG_ID, {isOpen: false}));
    }

    render() {
        return (
            <Dialog
                isOpen={this.props.isOpen}
                iconName="confirm"
                onClose={this.handleCancel}
                title={LayerSourcesDialog.DIALOG_TITLE}
                autoFocus={true}
                canEscapeKeyClose={true}
                canOutsideClickClose={true}
                enforceFocus={true}
            >
                {this.renderDialogBody()}
                {this.renderDialogFooter()}
            </Dialog>
        );
    }

    private renderDialogBody() {
        if (!this.props.isOpen) {
            return null;
        }
        return (
            <div className={Classes.DIALOG_BODY}>
                {this.renderDialogContents()}
            </div>
        );
    }


    private renderDialogFooter() {
        if (!this.props.isOpen) {
            return null;
        }
        return (
            <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                    {this.renderDialogFooterActions()}
                </div>
            </div>
        );
    }

    private renderDialogFooterActions() {
        const hasSelection = this.state.selectedIndices && this.state.selectedIndices.length;
        return [
            <Button key={0} onClick={this.handleCancel}>Cancel</Button>,
            <Button key={1} onClick={this.handleConfirm}
                    disabled={!hasSelection}
                    className="pt-intent-primary">OK</Button>
        ];
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

    private handleChangedVariableSelection(newSelection: number[]) {
        console.log("newSelection: ", newSelection);
        this.setState({selectedIndices: newSelection.slice()});
    }

    private renderDialogContents() {
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

}

export default connect(mapStateToProps)(LayerSourcesDialog);


function getLayerVariables(resources: ResourceState[]) {
    const layerVariables = [];
    for (let resource of resources) {
        for (let variable of resource.variables) {
            if (actions.isSpatialVariable(variable)) {
                layerVariables.push({resource, variable});
            }
        }
    }
    return layerVariables;
}


