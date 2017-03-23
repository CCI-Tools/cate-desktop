import * as React from 'react'

import {Field, IFieldProps} from "./Field";
import {NumericInput, Intent} from "@blueprintjs/core";
import {isNumber} from "../../../common/types";


interface INumberFieldProps extends IFieldProps<number> {
    min?: number;
    max?: number;
    isInt?: boolean;
}

/**
 * A NumberField is an input field that provides a floating point number.
 *
 * @author Norman Fomferra
 */
export class NumericField extends Field<number, INumberFieldProps> {

    constructor(props: INumberFieldProps) {
        super(props);
        this.onValueChange = this.onValueChange.bind(this);
    }

    protected parseValue(textValue: string): number|null {
        if (!textValue || textValue.trim() === '') {
            return null;
        }
        const value = parseFloat(textValue);
        if (isNaN(value) && textValue.toLowerCase() !== 'nan') {
            throw new Error('Please enter a valid number.');
        }
        return value;
    }

    protected validateValue(value: number|null): void {
        super.validateValue(value);
        if (value === null) {
            return;
        }
        if (this.props.isInt && value !== Math.floor(value)) {
            throw new Error('Value must be an integer');
        }
        if (isNumber(this.props.min) && value < this.props.min) {
            throw new Error('Value must be >= ' + this.props.min);
        }
        if (isNumber(this.props.max) && value > this.props.max) {
            throw new Error('Value must be <= ' + this.props.max);
        }
    }

    protected formatValue(value: number|null): string {
        if (!value && value !== 0.0) {
            return '';
        }
        return value.toString();
    }

    onValueChange(valueAsNumber: number, valueAsString: string) {
        super.notifyValueChange(valueAsString, valueAsNumber);
    }

    render() {
        let error = this.getError();
        return (<NumericInput onValueChange={this.onValueChange}
                              value={this.getTextValue()}
                              style={this.props.style}
                              intent={error ? Intent.DANGER : Intent.NONE}
                              min={this.props.min}
                              max={this.props.max}
                              cols={this.props.cols}
                              size={this.props.size}
                              minorStepSize={this.props.isInt ? 1: 0.1}
                              selectAllOnFocus={true}
        />);
    }
}
