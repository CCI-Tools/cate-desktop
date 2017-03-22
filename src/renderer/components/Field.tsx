import * as React from 'react'

// todo (forman): The "Value" used in Field should be this interface:
export interface Value<T> {
    textValue: string;
    value?: T;
    error?: Error | null;
}

export type ChangeHandler<T> = (textValue: string, value: T, error: any | null) => void;

export interface IFieldProps<T> {
    textValue?: string;
    value?: T | null;
    error?: any | null;
    onChange: ChangeHandler<T>;
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
        if (isNullOrUndefined(value)) {
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
            this.notifyValueChange(value, textValue);
        } catch (error) {
            this.props.onChange(textValue, value, error);
        }
    }

    protected notifyValueChange(textValue: string, value: T) {
        let error;
        try {
            this.validateValue(value);
        } catch (e) {
            error = e;
        }
        this.props.onChange(textValue, value, error);
    }

    protected computeTextValue() {
        return this.props.textValue || this.formatValue(this.props.value);
    }

    protected computeStyle() {
        let style = Object.assign({}, this.props.style);
        if (this.props.columns) {
            style['width'] = `${this.props.columns}em`;
        }
        if (this.props.textAlign) {
            style['textAlign'] = this.props.textAlign;
        }
        return style;
    }

    private computeClassNames() {
        return "pt-input " + (this.props.className || '') + (this.props.error ? 'pt-intent-danger' : '');
    }

    render() {
        return (
            <input type="text"
                   className={this.computeClassNames()}
                   style={this.computeStyle()}
                   value={this.computeTextValue()}
                   onChange={this.onChange}
                   placeholder={this.props.placeholder}
                   disabled={this.props.disabled}
            />
        );
    }

}

function isNullOrUndefined(value: any): boolean {
    return value === null || typeof(value) === 'undefined';
}
