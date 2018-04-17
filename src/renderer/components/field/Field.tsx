import * as React from 'react'
import {isString, isUndefinedOrNull, isDefined, isDefinedAndNotNull} from '../../../common/types';

export type FieldType<T> = T | null;

export interface FieldValue<T> {
    textValue?: string;
    value?: FieldType<T>;
    error?: Error | any;
}

type AnyFieldType = FieldType<any>;
type AnyFieldValue = FieldValue<any>;

export type FieldValidator = (value: AnyFieldType) => any;

export interface IFieldProps {
    value: AnyFieldValue | any;
    onChange: (value: AnyFieldValue) => void;
    validator?: FieldValidator;
    placeholder?: string;
    size?: number;
    className?: string;
    style?: { [key: string]: any };
    disabled?: boolean;
    uncontrolled?: boolean;
}

type IFieldState = AnyFieldValue | null;

export function toTextValue(value: AnyFieldValue | any) {
    if (isFieldValue(value)) {
        return isDefinedAndNotNull(value.textValue) ? value.textValue : `${value.value}`;
    } else if (isString(value)) {
        return value;
    }
    return isDefinedAndNotNull(value) ? `${value}` : '';
}

export function toValue(value: any) {
    if (isFieldValue(value)) {
        return value.value;
    }
    return value;
}


/**
 * A Field represents a text input field that provides a value of some type
 * characterised by the "valueHandler" property.
 *
 * @author Norman Fomferra
 */
export class Field<P extends IFieldProps> extends React.PureComponent<P, IFieldState> {

    static readonly NOMINAL_CLASS = 'pt-input';
    static readonly ERROR_CLASS = 'pt-input pt-intent-danger';

    protected _fieldValue: AnyFieldValue;

    constructor(props: Readonly<P>) {
        super(props);
        this._fieldValue = this.toFieldValue(props.value);
        if (this.props.uncontrolled) {
            this.state = this._fieldValue;
        }
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    getValue(): AnyFieldType {
        return this._fieldValue.value;
    }

    setValue(value: AnyFieldValue | any | null) {
        this.setFieldValue(this.newFieldValueFromValue(value));
    }

    setValueAndTextValue(value: any | null, textValue: string) {
        this.setFieldValue(this.newFieldValueFromValueAndTextValue(value, textValue));
    }

    getTextValue(): string {
        return this._fieldValue.textValue || '';
    }

    setTextValue(textValue: string) {
        this.setFieldValue(this.newFieldValueFromTextValue(textValue));
    }

    getError(): Error | any {
        return this._fieldValue.error;
    }

    setError(error: Error | null) {
        this.setFieldValue({...this._fieldValue, error});
    }

    componentWillReceiveProps(nextProps: Readonly<P>): void {
        this._fieldValue = this.toFieldValue(nextProps.value);
        if (this.props.uncontrolled) {
            this.setState(this._fieldValue);
        }
    }

    parseValue(textValue: string): AnyFieldType {
        if (!textValue || textValue === '') {
            return null;
        }
        return textValue;
    }

    formatValue(value: AnyFieldType): string {
        if (isUndefinedOrNull(value)) {
            return '';
        } else if (isString(value)) {
            return value;
        }
        return `${value}`;
    }

    validateValue(value: AnyFieldType): void {
        if (this.props.validator) {
            this.props.validator(value);
        }
    }

    protected handleKeyPress(event: any) {
        if (this.props.uncontrolled && event.charCode === 13) {
            this.props.onChange(this.state);
        }
    }

    protected handleBlur() {
        if (this.props.uncontrolled) {
            this.props.onChange(this.state);
        }
    }

    protected handleInputChange(event: any) {
        const textValue = event.target.value;
        this.setTextValue(textValue || '');
    }

    private newFieldValueFromTextValue(textValue: string): AnyFieldValue {
        let value = null;
        let error;
        try {
            value = this.parseValue(textValue);
            this.validateValue(value);
        } catch (e) {
            value = this._fieldValue ? this._fieldValue.value : value;
            error = e;
        }
        return {textValue, value, error};
    }

    private newFieldValueFromValue(value: AnyFieldValue | any | null): AnyFieldValue {
        if (isFieldValue(value)) {
            return {...value as AnyFieldValue};
        }
        let textValue;
        let error;
        try {
            textValue = this.formatValue(value);
        } catch (e) {
            textValue = '';
            error = e;
        }
        try {
            this.validateValue(value);
        } catch (e) {
            error = e;
        }
        return {textValue, value, error};
    }

    private newFieldValueFromValueAndTextValue(value: any | any, textValue: string): AnyFieldValue {
        let error;
        try {
            this.validateValue(value);
        } catch (e) {
            error = e;
        }
        return {textValue, value, error};
    }

    private toFieldValue(value: any): AnyFieldValue {
        if (isFieldValue(value)) {
            return value;
        } else if (isString(value)) {
            return this.newFieldValueFromTextValue(value as string);
        } else {
            return this.newFieldValueFromValue(value);
        }
    }

    private setFieldValue(fieldValue: AnyFieldValue) {
        this._fieldValue = fieldValue;
        if (this.props.uncontrolled) {
            this.setState(fieldValue);
        } else {
            this.props.onChange(fieldValue);
        }
    }

    render() {
        const error = this.getError();
        // console.log("Field.render: fieldValue = ", this._fieldValue);
        const errorClassName = Field.ERROR_CLASS + ' ' + this.props.className;
        const nominalClassName = Field.NOMINAL_CLASS + ' ' + this.props.className;
        return (
            <input value={this.getTextValue()}
                   onChange={this.handleInputChange}
                   onBlur={this.handleBlur}
                   onKeyPress={this.handleKeyPress}
                   type="text"
                   className={error ? errorClassName : nominalClassName}
                   style={this.props.style}
                   size={this.props.size}
                   placeholder={this.props.placeholder}
                   disabled={this.props.disabled}
            />
        );
    }
}

export function isFieldValue(value: any): boolean {
    return isDefinedAndNotNull(value) && (isDefined(value.textValue) || isDefined(value.value));
}

