import * as React from 'react';
import {Dialog, Classes, Button, Tooltip, RangeSlider, NumberRange} from "@blueprintjs/core";
import {DataSourceState, DialogState} from "../state";

interface IOpenDatasetDialogProps {
    dataSource: DataSourceState;
    coveredTimeRange: NumberRange|null;
    onConfirm: (dataSourceId: string, timeRange: NumberRange) => void;
    onCancel: () => void;
}

export interface IOpenDatasetDialogState extends DialogState {
    timeRange: NumberRange;
}

export class OpenDatasetDialog extends React.Component<IOpenDatasetDialogProps, IOpenDatasetDialogState> {
    static resourceId = 0;
    static readonly DIALOG_ID = 'openDataset';
    readonly MILLIS_A_DAY = 1000 * 60 * 60 * 24;

    constructor(props: IOpenDatasetDialogProps) {
        super(props);
        this.state = {
            isOpen: true,
            timeRange: this.props.coveredTimeRange
        };
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.updateRange = this.updateRange.bind(this);
    }

    componentWillReceiveProps(nextProps: IOpenDatasetDialogProps, nextContext: any) {
        this.updateRange(nextProps.coveredTimeRange);
    }

    private handleConfirm() {
        if (this.state.timeRange[0] && this.state.timeRange[1]) {
            this.props.onConfirm(this.props.dataSource.id, this.state.timeRange);
        } else {
            this.props.onConfirm(this.props.dataSource.id, null);
        }
    }

    private handleCancel() {
        this.props.onCancel();
    }

    private updateRange(timeRange: NumberRange) {
        this.setState({timeRange} as IOpenDatasetDialogState);
    }

    private static renderLabelAsDates(value) {
        const date = new Date(value);
        return date.getUTCFullYear() +
            '-' + (date.getUTCMonth() + 1) +
            '-' + date.getUTCDate();
    }
    ;

    render() {
        let timeSelector = null;
        if (this.props.coveredTimeRange) {
            const startMillis = this.props.coveredTimeRange[0];
            const endMillis = this.props.coveredTimeRange[1];
            if (startMillis && endMillis) {
                const stepSize = (endMillis - startMillis) / 4;
                // onChange={this.handleRangeSelected}
                timeSelector = (
                    <div>
                        <p>Select a time range:</p>
                        <div style={{ width: "100%", padding: 10}}>
                            <RangeSlider
                                min={startMillis}
                                max={endMillis}
                                stepSize={this.MILLIS_A_DAY}
                                labelStepSize={stepSize}
                                onChange={this.updateRange}
                                value={this.state.timeRange}
                                renderLabel={OpenDatasetDialog.renderLabelAsDates}
                            />
                        </div>
                    </div>
                );
            } else {
                timeSelector = (
                    <div style={{ width: "100%", padding: 10}}>
                        No time information available.
                    </div>
                );
            }
        } else {
            timeSelector = (
                <div style={{ width: "100%", padding: 10}}>
                    Loading time coverage...
                </div>
            );
        }

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
                    {timeSelector}
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button onClick={this.handleCancel}>Cancel</Button>
                        <Tooltip content="Opens the dataset." inline>
                            <Button className="pt-intent-primary"
                                    onClick={this.handleConfirm}
                                    iconName="folder-shared-open"
                                    disabled={!this.props.coveredTimeRange}
                            >Open</Button>
                        </Tooltip>
                    </div>
                </div>
            </Dialog>
        );
    }
}
