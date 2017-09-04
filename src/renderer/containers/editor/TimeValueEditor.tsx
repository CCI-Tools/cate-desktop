import * as React from 'react';
import {IValueEditorProps} from "./ValueEditor";
import {DateRange} from "@blueprintjs/datetime";
import {FieldValue} from "../../components/field/Field";
import {DEFAULT_DATE_RANGE, DateField, parseDate} from "../../components/field/DateField";

interface ITimeValueEditorProps extends IValueEditorProps<string>  {
}

export class TimeValueEditor extends React.PureComponent<ITimeValueEditorProps, null> {

    constructor(props: ITimeValueEditorProps) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    onChange(value: FieldValue<Date>) {
        const textValue = value.textValue;
        const error = value.error;
        this.props.onChange(this.props.input, {textValue, value: textValue, error});
    }

    render() {
        const valueMinMax = this.getValueMinMax();
        return (
            <DateField
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
                min = DEFAULT_DATE_RANGE[0];
                max = DEFAULT_DATE_RANGE[1];
            }
        }
        return [min, max];
    }
}
