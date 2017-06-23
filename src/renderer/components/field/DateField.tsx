import * as React from 'react';
import {DateInput, DateRange} from "@blueprintjs/datetime";
import {Field, FieldType, FieldValue, IFieldProps} from "./Field";
import {formatDateAsISODateString} from "../../../common/format";
import {isUndefinedOrNull} from "../../../common/types";

export type DateFieldType = FieldType<Date>;

export interface IDateFieldProps extends IFieldProps {
    nullable?: boolean;
    min?: Date;
    max?: Date;
}

export const DEFAULT_MIN_DATE = new Date('1980-01-01');
export const DEFAULT_MAX_DATE = new Date(Date.now());
export const DEFAULT_DATE_RANGE: DateRange = [DEFAULT_MIN_DATE, DEFAULT_MAX_DATE];

export class DateField extends Field<IDateFieldProps> {

    constructor(props: IDateFieldProps) {
        super(props);
        this.handleDateInputChange = this.handleDateInputChange.bind(this);
        this.handleDataInputError = this.handleDataInputError.bind(this);
    }

    parseValue(textValue: string): DateFieldType {
        return parseDate(textValue, this.props.nullable);
    }

    formatValue(value: DateFieldType): string {
        return formatDate(value);
    }

    validateValue(value: DateFieldType) {
        super.validateValue(value);
        validateDate(value, this.props.nullable, this.props.min, this.props.max);
    }

    private handleDateInputChange(date: Date) {
        this.setValue(date);
    }

    private handleDataInputError(date: Date) {
        this.setError(new Error('Invalid date.'));
    }

    render() {
        const error = this.getError();
        const value = this.getValue();
        const minDate = this.props.min || DEFAULT_MIN_DATE;
        const maxDate = this.props.max || DEFAULT_MAX_DATE;

        return (
                <DateInput className={error ? "pt-intent-danger" : null}
                           value={value}
                           format="YYYY-MM-DD"
                           locale={'en'}
                           disabled={this.props.disabled}
                           onChange={this.handleDateInputChange}
                           onError={this.handleDataInputError}
                           minDate={minDate}
                           maxDate={maxDate}
                />
        );
    }
}

export function parseDate(textValue: string, nullable: boolean, name?: string): Date|null {
    if (!textValue || textValue.trim() === '') {
        if (nullable) {
            return null;
        }
        throw new Error('Date must be given.');
    }
    let millis;
    try {
        millis = Date.parse(textValue.trim());
    } catch (e) {
        throw new Error(`Invalid ${name || 'date'}.`);
    }
    return new Date(millis);
}

export function formatDate(value: Date|null): string {
    if (isUndefinedOrNull(value)) {
        return '';
    }
    return formatDateAsISODateString(value);
}

export function validateDate(date: Date|null, nullable: boolean|null, min: Date|null, max: Date|null, name?: string) {
    if (!date) {
        if (!nullable) {
            throw Error('Date value expected.');
        }
        return;
    }
    if (min && date.getDate() < min.getDate()) {
        throw new Error(`${name || 'Date'} must not be before ${formatDate(min)}.`);
    }
    if (max && date.getDate() > max.getDate()) {
        throw new Error(`${name || 'Date'} must not be after ${formatDate(max)}.`);
    }
}

