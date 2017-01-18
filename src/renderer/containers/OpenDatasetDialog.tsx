import * as React from 'react';
import {Dialog, Classes, Button, Tooltip, RangeSlider, NumberRange} from "@blueprintjs/core";
import {DataSourceState, DialogState} from "../state";

interface IOpenDatasetDialogProps {
    dataSource: DataSourceState;
    coveredTimeRange: NumberRange|null;
    onConfirm: (dataSourceId: string, args: any) => void;
    onCancel: () => void;
}

export interface IOpenDatasetDialogState extends DialogState {
    timeRange: NumberRange;
    protocolName: string;
}

export class OpenDatasetDialog extends React.Component<IOpenDatasetDialogProps, IOpenDatasetDialogState> {
    static resourceId = 0;
    static readonly DIALOG_ID = 'openDataset';
    readonly MILLIS_A_DAY = 1000 * 60 * 60 * 24;

    constructor(props: IOpenDatasetDialogProps) {
        super(props);
        this.state = {
            isOpen: true,
            ... OpenDatasetDialog.propsToState(this.props)
        };
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.updateRange = this.updateRange.bind(this);
        this.handleProtocolSelected = this.handleProtocolSelected.bind(this);
    }

    componentWillReceiveProps(nextProps: IOpenDatasetDialogProps, nextContext: any) {
        this.setState(OpenDatasetDialog.propsToState(nextProps));
    }

    private static propsToState(props: IOpenDatasetDialogProps): IOpenDatasetDialogState {

        let protocolName = null;
        if (props.dataSource.meta_info) {
            const protocols = props.dataSource.meta_info.protocols;
            if (protocols && protocols.length > 1) {
                protocolName = protocols[0];
            }
        }
        return {timeRange: props.coveredTimeRange, protocolName: protocolName};
    }

    private handleConfirm() {
        this.props.onConfirm(this.props.dataSource.id, this.assembleArguments());
    }

    private assembleArguments() {
        let args = {};
        if (this.state.timeRange[0] && this.state.timeRange[1]) {
            args = {
                start_date: `${OpenDatasetDialog.formatMillisToDate(this.state.timeRange[0])}`,
                end_date: `${OpenDatasetDialog.formatMillisToDate(this.state.timeRange[1])}`,
            }
        }
        if (this.state.protocolName != null) {
            args = {
                protocol: this.state.protocolName,
                ...args
            }
        }
        return args;
    }

    private static formatMillisToDate(dateMillis: number) {
        return new Date(dateMillis).toISOString().slice(0, 10)
    }

    private handleCancel() {
        this.props.onCancel();
    }

    private updateRange(timeRange: NumberRange) {
        this.setState({timeRange} as IOpenDatasetDialogState);
    }

    private handleProtocolSelected(event) {
        const protocolName = event.target.value;
        this.setState({protocolName} as IOpenDatasetDialogState);
    }

    private renderProtocolSelector() {
        if (!this.state.protocolName) {
            return null;
        }
        const options = [];
        for (let protocolName of this.props.dataSource.meta_info.protocols) {
            options.push(<option key={protocolName} value={protocolName}>{protocolName}</option>);
        }
        return (
            <label className="pt-label pt-inline">
                Protocols:
                <div className="pt-select" style={{padding: '0.2em'}}>
                    <select value={this.state.protocolName}
                            onChange={this.handleProtocolSelected}>
                        {options}
                    </select>
                </div>
            </label>
        );
    }

    private renderTimeSelector() {
        if (this.props.coveredTimeRange) {
            const startMillis = this.props.coveredTimeRange[0];
            const endMillis = this.props.coveredTimeRange[1];
            if (startMillis && endMillis) {
                const stepSize = (endMillis - startMillis) / 4;
                return (
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
                                renderLabel={OpenDatasetDialog.formatMillisToDate}
                            />
                        </div>
                    </div>
                );
            } else {
                return (
                    <div style={{ width: "100%", padding: 10}}>
                        No time information available.
                    </div>
                );
            }
        } else {
            return (
                <div style={{ width: "100%", padding: 10}}>
                    Loading time coverage...
                </div>
            );
        }
    }

    render() {
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
                    {this.renderTimeSelector()}
                    {this.renderProtocolSelector()}
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
