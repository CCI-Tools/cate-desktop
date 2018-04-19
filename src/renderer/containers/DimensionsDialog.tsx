import * as React from 'react';
import {VariableState, ResourceState} from "../state";
import {ListBoxSelectionMode, ListBox} from "../components/ListBox";
import {LabelWithType} from "../components/LabelWithType";
import {ModalDialog} from "../components/ModalDialog";
import {ScrollablePanelContent} from "../components/ScrollableContent";

interface IDimensionsDialogProps {
    isOpen: boolean;
    value: string[];
    variable: VariableState;
    onConfirm: (value: string[]) => void;
    onCancel: () => void;
    multiSelect?: boolean;
}

interface IDimensionssDialogState {
    value: string[] | null;
}

export class DimensionsDialog extends React.Component<IDimensionsDialogProps, IDimensionssDialogState> {

    constructor(props: IDimensionsDialogProps) {
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
                title={this.props.multiSelect ? "Select Dimensions" : "Select Dimension"}
                iconName="variable"
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

        const dimensions = this.props.variable.dimNames;
        if (!dimensions) {
            return (<p>{`Variable "${this.props.variable.name}" does not seem to have any dimensions.`}</p>);
        }
        return (
            <ScrollablePanelContent>
                <p>{this.props.multiSelect ? "Select one or more dimensions:" : "Select dimension:"}</p>
                <ListBox items={dimensions}
                         getItemKey={DimensionsDialog.getDimItemKey}
                         renderItem={DimensionsDialog.renderDimItem}
                         selectionMode={this.props.multiSelect ? ListBoxSelectionMode.MULTIPLE : ListBoxSelectionMode.SINGLE}
                         selection={this.state.value}
                         style={{height: '20em'}}
                         onSelection={this.onSelection}
                         onItemDoubleClick={this.state.value ? this.onConfirm : null}/>
            </ScrollablePanelContent>
        );
    }

    //noinspection JSUnusedLocalSymbols
    private static getDimItemKey(dimension: string) {
        return dimension;
    }

    private static renderDimItem(dimension: string) {
        return (
            <div>
            {dimension}
            </div>
        );
    }
}
