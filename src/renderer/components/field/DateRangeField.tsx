import * as React from 'react';
import {DateRange, DateInput} from "@blueprintjs/datetime";
import {Field, IFieldProps} from "./Field";
import {isUndefinedOrNull} from "../../../common/types";
import {DEFAULT_MAX_DATE, DEFAULT_MIN_DATE, formatDate, parseDate, validateDate} from "./DateField";


interface IDateRangeFieldProps extends IFieldProps<DateRange> {
    min?: Date;
    max?: Date;
}

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
        this.props.onChange({textValue: this.getFormattedValue(newDateRange), value: newDateRange});
    }

    onDate2Change(date: Date) {
        const oldDateRange = this.getValue();
        const newDateRange: DateRange = [oldDateRange && oldDateRange[0], date];
        this.props.onChange({textValue: this.getFormattedValue(newDateRange), value: newDateRange});
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
            validateDate(date1, this.props.min, this.props.max, "First date");
        }
        if (date2) {
            validateDate(date2, this.props.min, this.props.max, "Second date");
        }
        if (date1 && date2 && date1.getDate() > date2.getDate()) {
            throw new Error('First date must not be after second date.');
        }
    }

    render() {
        const value = this.getValue();
        const value1 = value && value[0];
        const value2 = value && value[1];
        const minDate = this.props.min || DEFAULT_MIN_DATE;
        const maxDate = this.props.max || DEFAULT_MAX_DATE;
        //console.log('DateRangeInput props', value, minDate, maxDate);
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
