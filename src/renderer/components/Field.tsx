import * as React from 'react'
import {isString, isUndefinedOrNull, isDefined} from "../../common/types";

export interface FieldValue<T> {
    textValue?: string;
    value?: T;
    error?: Error | null;
}

export type FieldChangeHandler<T> = (value: FieldValue<T>) => void;

export interface IFieldProps<T> {
    value: FieldValue<T>|string|any;
    onChange: FieldChangeHandler<T>;
    placeholder?: string;
    textAlign?: string;
    columns?: number;
    className?: string;
    style?: { [key: string]: any };
    disabled?: boolean;
    nullable?: boolean;
}

/**
 * A Field is an text input field that provides a value of type T.
 *
 * @author Norman Fomferra
 */
export class Field<T, P extends IFieldProps<T>> extends React.PureComponent<P, null> {

    constructor(props: IFieldProps<T>) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    protected parseValue(textValue: string): T {
        return textValue as any;
    }

    protected formatValue(value: T): string {
        if (value === null) {
            return '';
        } else if (typeof(value) === 'string') {
            return value;
        } else {
            return `${value}`;
        }
    }

    protected validateValue(value: T): void {
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
        return isDefined(value) && (isDefined(value.textValue) || isDefined(value.value));
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

    getValue(): T {
        const value = this.props.value;
        if (Field.isFieldValue(value)) {
            return value.value;
        }
        return value as T;
    }

    getError(): Error|null {
        const value = this.props.value;
        if (Field.isFieldValue(value)) {
            return value.error;
        }
        return null;
    }


    getStyle() {
        let style = Object.assign({}, this.props.style);
        if (this.props.columns) {
            style['width'] = `${this.props.columns}em`;
        }
        if (this.props.textAlign) {
            style['textAlign'] = this.props.textAlign;
        }
        return style;
    }

    getClassNames() {
        const error = this.getError();
        return "pt-input " + (this.props.className || '') + (error ? 'pt-intent-danger' : '');
    }

    render() {
        return (
            <input type="text"
                   className={this.getClassNames()}
                   style={this.getStyle()}
                   value={this.getTextValue()}
                   onChange={this.onChange}
                   placeholder={this.props.placeholder}
                   disabled={this.props.disabled}
            />
        );
    }
}

