import * as React from 'react';
import {Dialog, Classes, Button, Tooltip, RangeSlider, NumberRange} from "@blueprintjs/core";
import {DataSourceState, DialogState} from "../state";

interface IOpenDatasetDialogProps {
    onClose: (actionId: string, dialogState: IOpenDatasetDialogState) => void;
    dataSource: DataSourceState;
    timeRange?: NumberRange;
}

export interface IOpenDatasetDialogState extends DialogState {
    timeRange: NumberRange;
}

export class OpenDatasetDialog extends React.Component<IOpenDatasetDialogProps, IOpenDatasetDialogState> {
    static readonly DIALOG_ID = 'openDataset';

    constructor(props: IOpenDatasetDialogProps) {
        super(props);
        this.state = {isOpen: true, timeRange: this.props.timeRange || [1990, 2010]};
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
    }

    private close(dialogId: string) {
        this.setState(Object.assign({}, this.state, {isOpen: false}), () => {
            this.props.onClose(dialogId, this.state);
        });
    }

    private handleConfirm() {
        this.close('open');
    }

    private handleCancel() {
        this.close(null);
    }

    private handleRangeSelected(timeRange: NumberRange) {
        this.setState({timeRange} as IOpenDatasetDialogState);
    }

    render() {

        const timeLineSlider = (
            <div style={{ width: "100%", padding: 10}}>
                <RangeSlider
                    min={1980}
                    max={2020}
                    stepSize={1}
                    labelStepSize={5}
                    onChange={this.handleRangeSelected.bind(this)}
                    value={this.state.timeRange}
                />
            </div>
        );


        return (
            <Dialog
                isOpen={this.state.isOpen}
                iconName="database"
                onClose={this.handleCancel}
                title="Open Dataset"
                autoFocus={true}
                canEscapeKeyClose={true}
                canOutsideClickClose={true}
                enforceFocus={true}
            >
                <div className={Classes.DIALOG_BODY}>
                    <p>You are about to open a dataset from data source</p>
                    <p><strong>{this.props.dataSource.name}</strong>.</p>
                    <p>Select a time range:</p>
                    {timeLineSlider}
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button onClick={this.handleCancel}>Cancel</Button>
                        <Tooltip content="Opens the dataset." inline>
                            <Button className="pt-intent-primary"
                                    onClick={this.handleConfirm}
                                    iconName="folder-shared-open">Open</Button>
                        </Tooltip>
                    </div>
                </div>
            </Dialog>
        );
    }
}
