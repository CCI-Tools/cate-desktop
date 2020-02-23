import * as React from 'react';
import {VariableState, ResourceState} from "../state";
import {ListBoxSelectionMode, ListBox} from "../components/ListBox";
import {LabelWithType} from "../components/LabelWithType";
import {ModalDialog} from "../components/ModalDialog";
import {ScrollablePanelContent} from "../components/ScrollableContent";

interface IVariablesDialogProps {
    isOpen: boolean;
    value: string[];
    resource: ResourceState;
    onConfirm: (value: string[]) => void;
    onCancel: () => void;
    multiSelect?: boolean;
}

interface IVariablesDialogState {
    value: string[] | null;
}

export class VariablesDialog extends React.Component<IVariablesDialogProps, IVariablesDialogState> {

    constructor(props: IVariablesDialogProps) {
        super(props);
        this.onSelection = this.onSelection.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.state = {value: this.props.value};
    }

    private onSelection(value: string[]) {
        this.setState({value});
    }

    private onConfirm() {
        this.props.onConfirm(this.state.value);
    }

    render() {
        return (
            <ModalDialog
                isOpen={this.props.isOpen}
                title={this.props.multiSelect ? "Select Variables" : "Select Variable"}
                icon="variable"
                onConfirm={this.onConfirm}
                onCancel={this.props.onCancel}
                renderBody={this.renderBody}
            />
        );
    }

    private renderBody() {
        if (!this.props.isOpen) {
            return null;
        }

        const variables = this.props.resource.variables;
        if (!variables) {
            return (<p>{`Resource "${this.props.resource.name}" does not seem to have any variables.`}</p>);
        }
        return (
            <ScrollablePanelContent>
                <p>{this.props.multiSelect ? "Select one or more the variables:" : "Select variable:"}</p>
                <ListBox items={variables}
                         getItemKey={VariablesDialog.getVariableItemKey}
                         renderItem={VariablesDialog.renderVariableItem}
                         selectionMode={this.props.multiSelect ? ListBoxSelectionMode.MULTIPLE : ListBoxSelectionMode.SINGLE}
                         selection={this.state.value}
                         style={{height: '20em'}}
                         onSelection={this.onSelection}
                         onItemDoubleClick={this.state.value ? this.onConfirm : null}/>
            </ScrollablePanelContent>
        );
    }

    //noinspection JSUnusedLocalSymbols
    private static getVariableItemKey(variable: VariableState) {
        return variable.name;
    }

    private static renderVariableItem(variable: VariableState) {
        const dataType = variable.dimNames ? `${variable.dataType}[${variable.dimNames}]` : `${variable.dataType}`;
        return (
            <div>
                <LabelWithType label={variable.name}
                               dataType={dataType}
                               units={variable.units}
                               tooltipText={variable.attributes && variable.attributes.long_name}
                />
            </div>
        );
    }
}


