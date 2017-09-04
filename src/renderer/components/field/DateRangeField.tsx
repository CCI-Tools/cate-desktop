import * as React from 'react';
import {DateRange} from "@blueprintjs/datetime";
import {Field, FieldType, FieldValue, IFieldProps} from "./Field";
import {isUndefinedOrNull} from "../../../common/types";
import {formatDate, parseDate, validateDate} from "./DateField";

export type DateRangeFieldType = FieldType<DateRange>;
export type DateRangeFieldValue = FieldValue<DateRange>;

interface IDateRangeFieldProps extends IFieldProps {
    nullable?: boolean;
    min?: Date;
    max?: Date;
}

export class DateRangeField extends Field<IDateRangeFieldProps> {

    public static defaultProps: Partial<IFieldProps> = {
        uncontrolled: true,
        placeholder: 'YYYY-MM-DD, YYYY-MM-DD',
        size: 24
    };

    constructor(props: IDateRangeFieldProps) {
        super(props);
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
