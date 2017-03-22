import * as React from 'react'

import {Field, IFieldProps} from "./Field";
import {NumericInput, Intent} from "@blueprintjs/core";

type NumberOrNull = number|null;

export interface INumberFieldProps extends IFieldProps<NumberOrNull> {
    exponential?: boolean;
    min?: number;
    max?: number;
    isInt?: boolean;
}

function isNumber(value: any): boolean {
    return typeof(value) === 'number';
}

/**
 * A NumberField is an input field that provides a floating point number.
 *
 * @author Norman Fomferra
 */
export class NumberField extends Field<NumberOrNull, INumberFieldProps> {

    constructor(props: INumberFieldProps) {
        super(props);
        this.onValueChange = this.onValueChange.bind(this);
    }

    protected parseValue(textValue: string): NumberOrNull {
        if (!textValue || textValue.trim() === '') {
            return null;
        }
        const value = parseFloat(textValue);
        if (isNaN(value) && textValue.toLowerCase() !== 'nan') {
            throw new Error('Please enter a valid number.');
        }
        return value;
    }

    protected validateValue(value: number): void {
        super.validateValue(value);
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

    protected formatValue(value: NumberOrNull): string {
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
