import * as React from 'react'
import {Field, FieldType} from "./Field";
import {INumericFieldProps, validateNumber} from "./NumericField";

export type NumericRange = [number, number];
export type NumericRangeFieldType = FieldType<NumericRange>;

export interface INumericRangeFieldProps extends INumericFieldProps {
}

/**
 * A NumericRangeField is an input field that provides a numeric range of two number values (x1 and x2 properties).
 *
 * @author Norman Fomferra
 */
export class NumericRangeField extends Field<INumericRangeFieldProps> {

    parseValue(textValue: string): NumericRangeFieldType {
        const pair = parseNumericPair(textValue);
        if (!pair) {
            return null;
        }
        const x1 = pair[0];
        const x2 = pair[1];
        if (x2 < x1) {
            return [x2, x1];
        }
        return pair;
    }

    validateValue(value: NumericRangeFieldType): void {
        super.validateValue(value);
        if (value === null) {
            return;
        }
        if (value.length !== 2) {
            throw new Error('Value must be a pair of numbers.');
        }
        validateNumber(value[0], this.props.min, this.props.max, this.props.isInt);
        validateNumber(value[1], this.props.min, this.props.max, this.props.isInt);
    }

    formatValue(value: NumericRangeFieldType | null): string {
        if (!value || value.length < 2) {
            return '';
        }
        return `${value[0]}, ${value[1]}`;
    }
}

export function parseNumericPair(textValue: string): [number, number] {
    if (!textValue || textValue.trim() === '') {
        return null;
    }
    const pair = textValue.split(',');
    if (pair.length === 2) {
        let x1 = parseFloat(pair[0]);
        let x2 = parseFloat(pair[1]);
        return [x1, x2];
    } else {
        throw new Error('Value must be a pair of numbers.');
    }
}
