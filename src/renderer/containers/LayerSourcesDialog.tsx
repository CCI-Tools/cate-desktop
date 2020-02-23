import * as React from 'react';
import {State, ResourceState, LayerState, DialogState, LayerVariableState} from "../state";
import {connect, DispatchProp} from "react-redux";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {ListBoxSelectionMode, ListBox} from "../components/ListBox";
import {LabelWithType} from "../components/LabelWithType";
import {ModalDialog} from "../components/ModalDialog";
import {ScrollablePanelContent} from "../components/ScrollableContent";

interface ILayerSourcesDialogProps extends DialogState {
    resources: ResourceState[];
    layers: LayerState[];
    savedLayers: {[name: string ]: LayerState};
    activeViewId: string;
    layerVariables: LayerVariableState[];
}

interface ILayerSourcesDialogState {
    selectedIndices: number[]|null;
}

function mapStateToProps(state: State): ILayerSourcesDialogProps {
    return {
        isOpen: selectors.dialogStateSelector(LayerSourcesDialog.DIALOG_ID)(state).isOpen,
        layers: selectors.layersSelector(state),
        savedLayers: selectors.savedLayersSelector(state),
        activeViewId: selectors.activeViewIdSelector(state),
        resources: selectors.resourcesSelector(state),
        layerVariables: selectors.selectedLayerVariablesSelector(state),
    };
}

class LayerSourcesDialog extends React.Component<DispatchProp<State> & ILayerSourcesDialogProps, ILayerSourcesDialogState> {
    static readonly DIALOG_ID = 'layerSourcesDialog';
    static readonly DIALOG_TITLE = 'Add Layer';

    constructor(props: DispatchProp<State> & ILayerSourcesDialogProps) {
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
        let selectLayer = true;
        for (let index of this.state.selectedIndices) {
            const layerVariable = this.props.layerVariables[index];
            this.props.dispatch(
                actions.addVariableLayer(this.props.activeViewId,
                    layerVariable.resource,
                    layerVariable.variable,
                    selectLayer,
                    this.props.savedLayers
                ));
            selectLayer = false;
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
                icon="layers"
                onCancel={this.onCancel}
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
        if (!this.props.layerVariables.length) {
            return (<p>There are currently no resource or variables that could be added as layers.</p>);
        }
        return (
            <ScrollablePanelContent>
                <p>Select the variables to wish to add as a layer:</p>
                <ListBox items={this.props.layerVariables}
                         getItemKey={LayerSourcesDialog.getVariableItemKey}
                         renderItem={LayerSourcesDialog.renderVariableItem}
                         selectionMode={ListBoxSelectionMode.MULTIPLE}
                         selection={this.state.selectedIndices}
                         onSelection={this.handleChangedVariableSelection}/>
            </ScrollablePanelContent>
        );
    }

    //noinspection JSUnusedLocalSymbols
    private static getVariableItemKey(variable: LayerVariableState, index: number) {
        return index;
    }

    private static renderVariableItem(layerVariable: LayerVariableState) {
        const variable = layerVariable.variable;
        return (
            <div>
                <span>{layerVariable.resource.name}</span>
                <span> / </span>
                <LabelWithType label={variable.name}
                               dataType={`${variable.dataType}[${variable.dimNames}]`}
                               units={variable.units}
                />
            </div>
        );
    }
}

export default connect(mapStateToProps)(LayerSourcesDialog);
