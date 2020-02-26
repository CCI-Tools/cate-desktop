import * as React from 'react';
import { IValueEditorProps } from './ValueEditor';
import { DateRange } from '@blueprintjs/datetime';
import { FieldValue } from '../../components/field/Field';
import { DateRangeField } from '../../components/field/DateRangeField';
import { parseDate } from '../../components/field/DateField';

interface ITimeRangeValueEditorProps extends IValueEditorProps<string> {
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
        const valueMinMax = this.getValueMinMax();
        return (
            <DateRangeField
                nullable={this.props.input.nullable}
                min={valueMinMax[0]}
                max={valueMinMax[1]}
                value={this.props.value}
                onChange={this.onChange}
            />
        );
    }

    private getValueMinMax(): DateRange {
        let min, max;
        const valueRange = this.props.input.valueRange as [string, string];
        if (valueRange) {
            try {
                min = parseDate(valueRange[0], true);
                max = parseDate(valueRange[1], true);
            } catch (e) {
                // ok
            }
        }
        return [min, max];
    }
}
