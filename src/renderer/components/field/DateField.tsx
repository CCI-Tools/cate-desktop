import * as React from 'react';
import {DateInput, DateRange} from "@blueprintjs/datetime";
import {Field, IFieldProps} from "./Field";
import {formatDateAsISODateString} from "../../../common/format";
import {isUndefinedOrNull} from "../../../common/types";

export interface IDateFieldProps extends IFieldProps<Date> {
    min?: Date;
    max?: Date;
}

export const DEFAULT_MIN_DATE = new Date('1980-01-01');
export const DEFAULT_MAX_DATE = new Date(Date.now());
export const DEFAULT_DATE_RANGE: DateRange = [DEFAULT_MIN_DATE, DEFAULT_MAX_DATE];

export class DateField extends Field<Date, IDateFieldProps> {

    constructor(props: IDateFieldProps) {
        super(props);
        this.onDateChange = this.onDateChange.bind(this);
        this.onDateError = this.onDateError.bind(this);
    }

    protected parseValue(textValue: string): Date|null {
        return parseDate(textValue, this.props.nullable);
    }

    protected formatValue(value: Date|null): string {
        return formatDate(value);
    }

    onDateChange(date: Date) {
        this.props.onChange({textValue: this.getFormattedValue(date), value: date});
    }

    onDateError(date: Date) {
        this.props.onChange({textValue: '', value: null, error: new Error('Invalid date.')});
    }

    validateValue(value: Date) {
        if (!value) {
            return;
        }
        const date = value;
        if (date) {
            validateDate(date, this.props.min, this.props.max);
        }
    }

    render() {
        const value = this.getValue();
        const minDate = this.props.min || DEFAULT_MIN_DATE;
        const maxDate = this.props.max || DEFAULT_MAX_DATE;
        const error = this.getError();

        return (
                <DateInput className={error ? "pt-intent-danger" : null}
                           value={value}
                           format="YYYY-MM-DD"
                           locale={'en'}
                           disabled={this.props.disabled}
                           onChange={this.onDateChange}
                           onError={this.onDateError}
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

export function validateDate(date: Date, min: Date|null, max: Date|null, name?: string) {
    if (min && date.getDate() < min.getDate()) {
        throw new Error(`${name || 'Date'} must not be before ${formatDate(min)}.`);
    }
    if (max && date.getDate() > max.getDate()) {
        throw new Error(`${name || 'Date'} must not be after ${formatDate(max)}.`);
    }
}

