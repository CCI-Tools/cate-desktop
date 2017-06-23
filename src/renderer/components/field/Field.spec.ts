import {should, expect} from 'chai';
import {Field, IFieldProps} from "./Field";

should();

describe('Field', () => {

    // class MyField extends Field<IFieldProps> {
    //
    //     trace: any[];
    //
    //     constructor(props: IFieldProps) {
    //         this.trace = [];
    //         super(props);
    //     }
    //
    //     parseValue(textValue: string): number {
    //         this.trace.push(['parseValue', textValue]);
    //         const v = parseInt(textValue);
    //         if (v + '' !== textValue) {
    //             throw Error("Oh, oh!");
    //         }
    //         return v;
    //     }
    //
    //     formatValue(value: number): string {
    //         this.trace.push(['formatValue', value]);
    //         return value + '';
    //     }
    //
    //     validateValue(value: number): void {
    //         this.trace.push(['validateValue', value]);
    //         if (value > 100) {
    //             throw Error('OOR!');
    //         }
    //     }
    // }
    //
    // describe('FieldValueHolder', () => {
    //
    //     let undefined;
    //     const onChange = (value: any) => {
    //     };
    //
    //     it('can create field value from undefined', () => {
    //         const field = new MyField({value: undefined, onChange});
    //         expect(field.fieldValue).to.deep.equal({value: undefined, textValue: "undefined", error: undefined});
    //     });
    //     it('can create field value from null', () => {
    //         const field = new MyField({value: null, onChange});
    //         expect(field.fieldValue).to.deep.equal({value: null, textValue: "null", error: undefined});
    //     });
    //     it('can create field value from textValue', () => {
    //         const field = new MyField({value: "78", onChange});
    //         expect(field.fieldValue).to.deep.equal({value: 78, textValue: "78", error: undefined});
    //     });
    //     it('can create field value from textValue - error', () => {
    //         const field = new MyField({value: "102", onChange});
    //         expect(field.fieldValue).to.deep.equal({value: 102, textValue: "102", error: new Error('OOR!')});
    //     });
    //     it('can create field value from value', () => {
    //         const field = new MyField({value: "79", onChange});
    //         expect(field.fieldValue).to.deep.equal({value: 79, textValue: "79", error: undefined});
    //     });
    //     it('can create field value from value - error', () => {
    //         const field = new MyField({value: "103", onChange});
    //         expect(field.fieldValue).to.deep.equal({value: 103, textValue: "103", error: new Error('OOR!')});
    //     });
    //     it('can create field value from fieldValue', () => {
    //         const field = new MyField({value: {value: 75}, onChange});
    //         expect(field.fieldValue).to.deep.equal({value: 75});
    //     });
    //     //
    //     //     it('setTextValue', () => {
    //     //         const changeTrace = [];
    //     //         const onChange = (value: any) => {
    //     //             changeTrace.push(value);
    //     //         };
    //     //         const field = new MyField({value: null, onChange});
    //     //         field.setTextValue('13');
    //     //         expect(field.textValue).to.equal('13');
    //     //         expect(field.value).to.equal(13);
    //     //         expect(field.error).to.be.undefined;
    //     //         expect(changeTrace).to.deep.equal([{value: 13, textValue: '13', error: undefined}]);
    //     //         expect(field.trace).to.deep.equal([
    //     //             ["formatValue", null],
    //     //             ["validateValue", null],
    //     //             ["parseValue", "13"],
    //     //             ["validateValue", 13]
    //     //         ]);
    //     //     });
    //     //     it('setTextValue with error', () => {
    //     //         const changeTrace = [];
    //     //         const onChange = (value: any) => {
    //     //             changeTrace.push(value);
    //     //         };
    //     //         const field = new MyField({value: null, onChange});
    //     //         const field = new FieldValueHolder(field, null, onChange);
    //     //         field.setTextValue('1.3');
    //     //         expect(field.textValue).to.equal('1.3');
    //     //         expect(field.value).to.equal(null);
    //     //         expect(field.error + '').to.equal('Error: Oh, oh!');
    //     //         expect(changeTrace).to.deep.equal([{value: null, textValue: '1.3', error: new Error('Oh, oh!')}]);
    //     //         expect(field.trace).to.deep.equal([
    //     //             ["formatValue", null],
    //     //             ["validateValue", null],
    //     //             ["parseValue", "1.3"],
    //     //         ]);
    //     //     });
    //     //     it('setValue', () => {
    //     //         const changeTrace = [];
    //     //         const onChange = (value: any) => {
    //     //             changeTrace.push(value);
    //     //         };
    //     //         const field = new MyField();
    //     //         const field = new FieldValueHolder(field, null, onChange);
    //     //         field.setValue(14);
    //     //         expect(field.textValue).to.equal('14');
    //     //         expect(field.value).to.equal(14);
    //     //         expect(field.error).to.be.undefined;
    //     //         expect(changeTrace).to.deep.equal([{value: 14, textValue: '14', error: undefined}]);
    //     //         expect(field.trace).to.deep.equal([
    //     //             ["formatValue", null],
    //     //             ["validateValue", null],
    //     //             ["formatValue", 14],
    //     //             ["validateValue", 14],
    //     //         ]);
    //     //     });
    //     //     it('setValue with error', () => {
    //     //         const changeTrace = [];
    //     //         const onChange = (value: any) => {
    //     //             changeTrace.push(value);
    //     //         };
    //     //         const field = new MyField();
    //     //         const field = new FieldValueHolder(field, null, onChange);
    //     //         field.setValue(101);
    //     //         expect(field.textValue).to.equal('101');
    //     //         expect(field.value).to.equal(101);
    //     //         expect(field.error + '').to.equal('Error: OOR!');
    //     //         expect(changeTrace).to.deep.equal([{value: 101, textValue: '101', error: new Error('OOR!')}]);
    //     //         expect(field.trace).to.deep.equal([
    //     //             ["formatValue", null],
    //     //             ["validateValue", null],
    //     //             ["formatValue", 101],
    //     //             ["validateValue", 101],
    //     //         ]);
    //     //     });
    //     //
    //     // });
    //     //
    // });
});
