import { Field, FieldType, FieldValue, IFieldProps } from './Field';

export type TextFieldType = FieldType<string>;
export type TextFieldValue = FieldValue<string>;

export interface ITextFieldProps extends IFieldProps {
    nullable?: boolean;
}

/**
 * A TextField represents a text input field providing values of type string.
 *
 * @author Norman Fomferra
 */
export class TextField extends Field<ITextFieldProps> {

    validateValue(value: TextFieldType): void {
        super.validateValue(value);
        if (!value && !this.props.nullable) {
            throw new Error('Text value expected.');
        }
    }
}

