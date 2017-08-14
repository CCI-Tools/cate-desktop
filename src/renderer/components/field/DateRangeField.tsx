import * as React from 'react';
import {DateRange, DateInput} from "@blueprintjs/datetime";
import {Field, FieldType, FieldValue, IFieldProps} from "./Field";
import {isUndefinedOrNull} from "../../../common/types";
import {DEFAULT_MAX_DATE, DEFAULT_MIN_DATE, formatDate, parseDate, validateDate} from "./DateField";

export type DateRangeFieldType = FieldType<DateRange>;
export type DateRangeFieldValue = FieldValue<DateRange>;

interface IDateRangeFieldProps extends IFieldProps {
    nullable?: boolean;
    min?: Date;
    max?: Date;
}

export class DateRangeField extends Field<IDateRangeFieldProps> {

    constructor(props: IDateRangeFieldProps) {
        super(props);
        this.handleDateInput1Change = this.handleDateInput1Change.bind(this);
        this.handleDateInput2Change = this.handleDateInput2Change.bind(this);
        this.handleDateInput1Error = this.handleDateInput1Error.bind(this);
        this.handleDateInput2Error = this.handleDateInput2Error.bind(this);
    }

    parseValue(textValue: string): DateRangeFieldType {
        return parseDateRange(textValue, this.props.nullable);
    }

    formatValue(value: DateRangeFieldType): string {
        return formatDateRange(value);
    }

    validateValue(value: DateRangeFieldType) {
        super.validateValue(value);
        validateDateRange(value, this.props.nullable, this.props.min, this.props.max);
    }

    private handleDateInput1Change(date: Date) {
        const oldDateRange = this.getValue();
        const newDateRange: DateRange = [date, oldDateRange && oldDateRange[1]];
        this.setValue(newDateRange);
    }

    private handleDateInput2Change(date: Date) {
        const oldDateRange = this.getValue();
        const newDateRange: DateRange = [oldDateRange && oldDateRange[0], date];
        this.setValue(newDateRange);
    }

    private handleDateInput1Error(date: Date) {
        this.setError(new Error('Invalid first date.'));
    }

    private handleDateInput2Error(date: Date) {
        this.setError(new Error('Invalid second date.'));
    }

    render() {
        //console.log('DateRangeInput props', value, minDate, maxDate);
        const error = this.getError();
        const value = this.getValue();
        const value1 = value && value[0];
        const value2 = value && value[1];
        const minDate = this.props.min || DEFAULT_MIN_DATE;
        const maxDate = this.props.max || DEFAULT_MAX_DATE;

        return (
            <div>
                <DateInput className={error ? "pt-intent-danger" : null}
                           value={value1}
                           format="YYYY-MM-DD"
                           locale={'en'}
                           disabled={this.props.disabled}
                           onChange={this.handleDateInput1Change}
                           onError={this.handleDateInput1Error}
                           minDate={minDate}
                           maxDate={maxDate}
                />
                <DateInput className={error ? "pt-intent-danger" : null}
                           value={value2}
                           format="YYYY-MM-DD"
                           locale={'en'}
                           disabled={this.props.disabled}
                           onChange={this.handleDateInput2Change}
                           onError={this.handleDateInput2Error}
                           minDate={minDate}
                           maxDate={maxDate}
                />
            </div>
        );
    }
}


export function parseDateRange(textValue: string, nullable: boolean): DateRange | null {
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

export function formatDateRange(value: DateRange | null): string {
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

export function validateDateRange(value: DateRange | null, nullable: boolean|null, min: Date|null, max: Date|null) {
    if (!value) {
        if (!nullable) {
            throw Error('Date range value expected.');
        }
        return;
    }
    const date1 = value[0];
    const date2 = value[1];
    validateDate(date1, nullable, min, max, "First date");
    validateDate(date2, nullable, min, max, "Second date");
    if (date1 && date2 && date1.valueOf() > date2.valueOf()) {
        throw new Error('First date must not be after second date.');
    }
}
