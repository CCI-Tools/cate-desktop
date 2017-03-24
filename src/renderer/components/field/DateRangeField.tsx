import * as React from 'react';
import {DateRangeInput, DateRange, DateInput} from "@blueprintjs/datetime";
import {Field, IFieldProps} from "./Field";
import {formatDateAsISODateString} from "../../../common/format";
import {isUndefinedOrNull} from "../../../common/types";


interface IDateRangeFieldProps extends IFieldProps<DateRange> {
    min?: Date;
    max?: Date;
}

export const DEFAULT_MIN_DATE = new Date('1980-01-01');
export const DEFAULT_MAX_DATE = new Date(Date.now());
export const DEFAULT_DATE_RANGE: DateRange = [DEFAULT_MIN_DATE, DEFAULT_MAX_DATE];

export class DateRangeField extends Field<DateRange, IDateRangeFieldProps> {

    constructor(props: IDateRangeFieldProps) {
        super(props);
        this.onDate1Change = this.onDate1Change.bind(this);
        this.onDate2Change = this.onDate2Change.bind(this);
        this.onDate1Error = this.onDate1Error.bind(this);
        this.onDate2Error = this.onDate2Error.bind(this);
    }

    protected parseValue(textValue: string): DateRange|null {
        return parseDateRange(textValue, this.props.nullable);
    }

    protected formatValue(value: DateRange|null): string {
        return formatDateRange(value);
    }

    onDate1Change(date: Date) {
        const oldDateRange = this.getValue();
        const newDateRange: DateRange = [date, oldDateRange && oldDateRange[1]];
        this.props.onChange({textValue: this.formatValue(newDateRange), value: newDateRange});
    }

    onDate2Change(date: Date) {
        const oldDateRange = this.getValue();
        const newDateRange: DateRange = [oldDateRange && oldDateRange[0], date];
        this.props.onChange({textValue: this.formatValue(newDateRange), value: newDateRange});
    }

    onDate1Error(date: Date) {
        this.props.onChange({textValue: '', value: null, error: new Error('Invalid first date.')});
    }

    onDate2Error(date: Date) {
        this.props.onChange({textValue: '', value: null, error: new Error('Invalid second date.')});
    }

    validateValue(value: DateRange) {
        if (!value) {
            return;
        }
        const date1 = value[0];
        const date2 = value[1];
        if (date1) {
            this.validateDate(date1, "First date");
        }
        if (date2) {
            this.validateDate(date2, "Second date");
        }
        if (date1 && date2 && date1.getDate() > date2.getDate()) {
            throw new Error('First date must not be after second date.');
        }
    }

    private validateDate(date: Date, name:string) {
        if (this.props.min && date.getDate() < this.props.min.getDate()) {
            throw new Error(`${name} must not be before ${formatDate(this.props.min)}.`);
        }
        if (this.props.max && date.getDate() > this.props.max.getDate()) {
            throw new Error(`${name} must not be after ${formatDate(this.props.max)}.`);
        }
    }

    render() {
        const value = this.getValue();
        const value1 = value && value[0];
        const value2 = value && value[1];
        const minDate = this.props.min || DEFAULT_MIN_DATE;
        const maxDate = this.props.max || DEFAULT_MAX_DATE;
        console.log('DateRangeInput props', value, minDate, maxDate);
        const error = this.getError();

        return (
            <div disabled={this.props.disabled}>
                <DateInput className={error ? "pt-intent-danger" : null}
                           value={value1}
                           format="YYYY-MM-DD"
                           locale={'en'}
                           disabled={this.props.disabled}
                           onChange={this.onDate1Change}
                           onError={this.onDate1Error}
                           minDate={minDate}
                           maxDate={maxDate}
                />
                <DateInput className={error ? "pt-intent-danger" : null}
                           value={value2}
                           format="YYYY-MM-DD"
                           locale={'en'}
                           disabled={this.props.disabled}
                           onChange={this.onDate2Change}
                           onError={this.onDate2Error}
                           minDate={minDate}
                           maxDate={maxDate}
                />
            </div>
        );
    }
}


export function parseDate(textValue: string, nullable: boolean, name: string): Date|null {
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
        throw new Error(`Invalid ${name}.`);
    }
    return new Date(millis);
}

export function parseDateRange(textValue: string, nullable: boolean): DateRange|null {
    if (!textValue || textValue.trim() === '') {
        if (nullable) {
            return null;
        }
        throw new Error('Date range must be given.');
    }
    const dateStrings = textValue.split(',');
    if (dateStrings.length !== 2 || dateStrings[0].trim() === '' || dateStrings[1].trim() === '') {
        throw new Error('Invalid date range.');
    }
    const date1 = parseDate(dateStrings[0], true, 'first date');
    const date2 = parseDate(dateStrings[1], true, 'second date');
    if (!date1 && !date2) {
        return null;
    }
    return [date1, date2];
}

export function formatDate(value: Date|null): string {
    if (isUndefinedOrNull(value)) {
        return '';
    }
    return formatDateAsISODateString(value);
}

export function formatDateRange(value: DateRange|null): string {
    if (isUndefinedOrNull(value)) {
        return '';
    }
    const date1 = value[0];
    const date2 = value[1];
    if (!date1 && !date2) {
        return '';
    }
    return formatDate(date1) + ',' + formatDate(date2);
}
