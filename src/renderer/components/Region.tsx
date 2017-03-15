import * as React from 'react';
import {RangeSlider, NumberRange} from "@blueprintjs/core";
import {formatMillisAsISODateString} from "../../common/format";
import {FloatField} from "./FloatField";

interface Value {
    west: number;
    south: number;
    east: number;
    north: number;
}

interface IBBoxProps {
    value: Value;
    onChange: (value: Value) => void;
    disabled: boolean;
}

export class Region extends React.PureComponent<IBBoxProps, null> {

    constructor(props: IBBoxProps) {
        super(props);
    }

    onWestChange(value: number) {
        this.props.onChange({...this.props.value, west: value});
    }

    onEastChange(value: number) {
        this.props.onChange({...this.props.value, east: value});
    }

    onNorthChange(value: number) {
        this.props.onChange({...this.props.value, north: value});
    }

    onSouthChange(value: number) {
        this.props.onChange({...this.props.value, south: value});
    }

    render() {
        const fractionDigits = 4;
        let disabled = this.props.disabled;
        return (
            <div>
                <table disabled={this.props.disabled}>
                    <tbody>
                    <tr>
                        <td>W</td>
                        <td>{this.renderFloatField(this.props.value.west, this.onWestChange.bind(this))}</td>
                        <td> E</td>
                        <td>{this.renderFloatField(this.props.value.east, this.onEastChange.bind(this))}</td>
                    </tr>
                    <tr>
                        <td>S</td>
                        <td>{this.renderFloatField(this.props.value.south, this.onSouthChange.bind(this))}</td>
                        <td> N</td>
                        <td>{this.renderFloatField(this.props.value.north, this.onNorthChange.bind(this))}</td>
                    </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    renderFloatField(value: number, onChange: (number) => void) {
        return (<FloatField value={value}
                            textAlign="right"
                            columns={8}
                            fractionDigits={4}
                            onChange={onChange}
                            disabled={this.props.disabled}
        />);
    }
}


