import * as React from 'react';
import {Dialog, Classes, Button, Tooltip, RangeSlider, NumberRange} from "@blueprintjs/core";
import {DataSourceState, DialogState} from "../state";

interface IOpenDatasetDialogProps {
    dataSource: DataSourceState;
    availableTimeRange: NumberRange|null;
    // timeInfoLoading: boolean;
    onConfirm: (dataSourceId: string, timeRange: NumberRange) => void;
    onCancel: () => void;
}

export interface IOpenDatasetDialogState extends DialogState {
    timeRange: NumberRange;
}

export class OpenDatasetDialog extends React.Component<IOpenDatasetDialogProps, IOpenDatasetDialogState> {
    static resourceId = 0;
    static readonly DIALOG_ID = 'openDataset';

    constructor(props: IOpenDatasetDialogProps) {
        super(props);
        this.state = {
            isOpen: true,
            timeRange: [NaN, NaN]
        };
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.handleRangeSelected = this.handleRangeSelected.bind(this);
    }

    private handleConfirm() {
        this.props.onConfirm(this.props.dataSource.id, this.state.timeRange);
    }

    private handleCancel() {
        this.props.onCancel();
    }

    private handleRangeSelected(timeRange: NumberRange) {
        this.setState({timeRange} as IOpenDatasetDialogState);
    }

    render() {
        const millisInDay = 1000 * 60 * 60 * 24;
        const disabled = !this.props.availableTimeRange;
        let timeLineSlider;
        if (!disabled) {
            const d1 = new Date(this.props.availableTimeRange[0]);
            const d2 = new Date(this.props.availableTimeRange[1]);
            const startYear = d1.getUTCFullYear();
            const endYear = d2.getUTCFullYear();
            let rangeStart, rangeEnd, stepDays;
            if (startYear === endYear) {
                // same year
                rangeStart = new Date(startYear, 1, 1).valueOf();
                rangeEnd = new Date(startYear + 1, 1, 1).valueOf();
                stepDays = 90;
                // y -> y+1
                // quarterly ticks
            } else {
                // multiple years
                rangeStart = new Date(startYear, 1, 1).valueOf();
                rangeEnd = new Date(endYear + 1, 1, 1).valueOf();
                stepDays = 365;
            }

            console.log(this.props.availableTimeRange, d1, d2, startYear, endYear);
            const renderLabelAsDates = value =>{
                const date = new Date(value);
                return date.getUTCFullYear() +
                    '-' + (date.getUTCMonth() + 1) +
                    '-' + date.getUTCDate();
            };
            // onChange={this.handleRangeSelected}
            timeLineSlider = (
                <div style={{ width: "100%", padding: 10}}>
                    <RangeSlider
                        min={rangeStart}
                        max={rangeEnd}
                        stepSize={millisInDay}
                        labelStepSize={millisInDay*stepDays}

                        value={[rangeStart, rangeEnd]}
                        renderLabel={renderLabelAsDates}
                    />
                </div>
            );
        } else {
            timeLineSlider = (
                <div style={{ width: "100%", padding: 10}}>
                    Loading time coverage
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
                    <p>Select a time range:</p>
                    {timeLineSlider}
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button onClick={this.handleCancel}>Cancel</Button>
                        <Tooltip content="Opens the dataset." inline>
                            <Button className="pt-intent-primary"
                                    onClick={this.handleConfirm}
                                    iconName="folder-shared-open"
                                    disabled={disabled}
                            >Open</Button>
                        </Tooltip>
                    </div>
                </div>
            </Dialog>
        );
    }
}
