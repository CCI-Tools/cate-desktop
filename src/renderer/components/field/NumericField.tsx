import * as React from 'react'

import {Field, FieldType, FieldValue, IFieldProps} from "./Field";
import {NumericInput, Intent} from "@blueprintjs/core";
import {isNumber, isUndefinedOrNull} from "../../../common/types";


export type NumericFieldType = FieldType<number>;
export type NumericFieldValue = FieldValue<number>;


export interface INumericFieldProps extends IFieldProps {
    nullable?: boolean;
    min?: number;
    max?: number;
    isInt?: boolean;
}


/**
 * A NumberField is an input field that provides a floating point number.
 *
 * @author Norman Fomferra
 */
export class NumericField extends Field<INumericFieldProps> {

    constructor(props: INumericFieldProps) {
        super(props);
        this.handleNumericInputChange = this.handleNumericInputChange.bind(this);
    }

    parseValue(textValue: string): NumericFieldType {
        if (!textValue || textValue.trim() === '') {
            return null;
        }
        const value = parseFloat(textValue);
        if (isNaN(value) && textValue.toLowerCase() !== 'nan') {
            throw new Error('Please enter a valid number.');
        }
        return value;
    }

    formatValue(value: NumericFieldType): string {
        if (isUndefinedOrNull(value)) {
            return '';
        }
        return value.toString();
    }

    validateValue(value: NumericFieldType): void {
        super.validateValue(value);
        validateNumber(value, this.props.nullable, this.props.min, this.props.max, this.props.isInt);
    }

    private handleNumericInputChange(value: number, textValue: string) {
        this.setValueAndTextValue(value, textValue);
    }

    render() {
        return (<NumericInput value={this.getTextValue()}
                              onValueChange={this.handleNumericInputChange}
                              onBlur={this.handleBlur}
                              onKeyPress={this.handleKeyPress}
                              style={this.props.style}
                              intent={this.getError() ? Intent.DANGER : Intent.NONE}
                              min={this.props.min}
                              max={this.props.max}
                              cols={this.props.cols}
                              size={this.props.size}
                              minorStepSize={this.props.isInt ? 1 : 0.1}
                              selectAllOnFocus={true}
        />);
    }
}

export function validateNumber(value: number | null, nullable?: boolean, min?: number | null, max?: number | null, isInt?: boolean): void {
    if (isUndefinedOrNull(value)) {
        if (!nullable) {
            throw Error('Numeric value expected');
        }
        return;
    }
    if (!isNumber(value)) {
        throw new Error(`Value must be a number.`);
    }
    if (isInt && value !== Math.floor(value)) {
        throw new Error('Value must be an integer.');
    }
    if (isNumber(min) && value < min) {
        throw new Error(`Value must be >= ${this.props.min}.`);
    }
    if (isNumber(max) && value > max) {
        throw new Error(`Value must be <= ${this.props.max}.`);
    }
}
