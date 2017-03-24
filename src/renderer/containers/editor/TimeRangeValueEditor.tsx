import * as React from 'react';
import {IValueEditorProps} from "./ValueEditor";
import {DateRange} from "@blueprintjs/datetime";
import {FieldValue, toTextValue} from "../../components/field/Field";
import {DateRangeField, parseDate, parseDateRange, DEFAULT_DATE_RANGE} from "../../components/field/DateRangeField";

interface ITimeRangeValueEditorProps extends IValueEditorProps<string>  {
}

export class TimeRangeValueEditor extends React.PureComponent<ITimeRangeValueEditorProps, null> {

    constructor(props: ITimeRangeValueEditorProps) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    onChange(value: FieldValue<DateRange>) {
        const textValue = value.textValue;
        const error = value.error;
        this.props.onChange(this.props.input, {textValue, value: textValue, error});
    }

    render() {
        const value = this.getValue();
        const valueMinMax = this.getValueMinMax();
        return (
            <DateRangeField
                min={valueMinMax[0]}
                max={valueMinMax[1]}
                value={value}
                onChange={this.onChange}
            />
        );
    }

    private getValue(): DateRange {
        try {
            return parseDateRange(toTextValue(this.props.value), true);
        } catch (e) {
            return DEFAULT_DATE_RANGE;
        }
    }

    private getValueMinMax(): DateRange {
        let min, max;
        const valueRange = this.props.input.valueRange as [string, string];
        if (valueRange) {
            try {
                min = parseDate(valueRange[0], true, '');
                max = parseDate(valueRange[1], true, '');
            } catch (e) {
                // ok
            }
        }
        return [min, max];
    }
}
