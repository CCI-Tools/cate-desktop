import * as React from 'react'
import {isString, isUndefinedOrNull, isDefined, isDefinedAndNotNull} from "../../../common/types";

export interface FieldValue<T> {
    textValue?: string;
    value?: T|null;
    error?: Error|null;
}

export type FieldChangeHandler<T> = (value: FieldValue<T>) => void;

export interface IFieldProps<T> {
    value: FieldValue<T>|any;
    onChange: FieldChangeHandler<T>;
    placeholder?: string;
    cols?: number;
    size?: number;
    className?: string;
    style?: { [key: string]: any };
    disabled?: boolean;
    nullable?: boolean;
}

/**
 * A Field represents a text input field that provides a value of type T.
 *
 * @author Norman Fomferra
 */
export class Field<T, P extends IFieldProps<T>> extends React.PureComponent<P, null> {

    private static readonly NOMINAL_CLASS = "pt-input";
    private static readonly ERROR_CLASS = "pt-input pt-intent-danger";

    constructor(props: IFieldProps<T>) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    protected parseValue(textValue: string): T|null {
        return textValue as any;
    }

    protected formatValue(value: T|null): string {
        if (value === null) {
            return '';
        } else if (typeof(value) === 'string') {
            return value;
        } else {
            return `${value}`;
        }
    }

    protected validateValue(value: T|null): void {
        if (isUndefinedOrNull(value)) {
            if (this.props.nullable) {
                return;
            }
            throw new Error('Please enter a value.');
        }
    }

    private onChange(event: any) {
        const textValue = event.target.value;
        let value;
        try {
            value = this.parseValue(textValue);
            this.notifyValueChange(textValue, value);
        } catch (error) {
            value = this.props.value.value;
            this.props.onChange({textValue, value, error});
        }
    }

    protected notifyValueChange(textValue: string, value: T) {
        let error;
        try {
            this.validateValue(value);
        } catch (e) {
            error = e;
        }
        this.props.onChange({textValue, value, error});
    }

    static isFieldValue(value: any): boolean {
        return isDefinedAndNotNull(value) && (isDefined(value.textValue) || isDefined(value.value));
    }

    getTextValue(): string {
        const value = this.props.value;
        if (Field.isFieldValue(value)) {
            return value.textValue || this.formatValue(value.value);
        } else if (isString(value)) {
            return value;
        }
        return this.formatValue(value);
    }

    getError(): Error|null {
        const value = this.props.value;
        if (Field.isFieldValue(value)) {
            return value.error;
        }
        return null;
    }

    render() {
        const error = this.getError();
        return (
            <input type="text"
                   className={error ? Field.ERROR_CLASS : Field.NOMINAL_CLASS}
                   style={this.props.style}
                   value={this.getTextValue()}
                   cols={this.props.cols}
                   size={this.props.size}
                   onChange={this.onChange}
                   placeholder={this.props.placeholder}
                   disabled={this.props.disabled}
            />
        );
    }
}
