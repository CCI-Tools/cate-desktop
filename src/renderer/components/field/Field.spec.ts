import {should, expect} from 'chai';
import {FieldValue, FieldValueHandler, FieldValueHolder} from "./Field";

should();

describe('Field', () => {

    class FieldValueHandlerImpl implements FieldValueHandler {

        trace = [];

        parseValue(textValue: string): number {
            this.trace.push(['parseValue', textValue]);
            const v = parseInt(textValue);
            if (v + '' !== textValue) {
                throw Error("Oh, oh!");
            }
            return v;
        }

        formatValue(value: number): string {
            this.trace.push(['formatValue', value]);
            return value + '';
        }

        validateValue(value: number): void {
            this.trace.push(['validateValue', value]);
            if (value > 100) {
                throw Error('OOR!');
            }
        }
    }

    describe('FieldValueHolder', () => {

        let undefined;

        it('can create field value from undefined', () => {
            const onChange = (value: FieldValue<any>) => {};
            const handler = new FieldValueHandlerImpl();
            const holder = new FieldValueHolder(handler, undefined, onChange);
            expect(holder.fieldValue).to.deep.equal({value: undefined, textValue: "undefined", error: undefined});
        });
        it('can create field value from null', () => {
            const onChange = (value: FieldValue<any>) => {};
            const handler = new FieldValueHandlerImpl();
            const holder = new FieldValueHolder(handler, null, onChange);
            expect(holder.fieldValue).to.deep.equal({value: null, textValue: "null", error: undefined});
        });
        it('can create field value from textValue', () => {
            const onChange = (value: FieldValue<any>) => {};
            const handler = new FieldValueHandlerImpl();
            const holder = new FieldValueHolder(handler, "78", onChange);
            expect(holder.fieldValue).to.deep.equal({value: 78, textValue: "78", error: undefined});
        });
        it('can create field value from textValue - error', () => {
            const onChange = (value: FieldValue<any>) => {};
            const handler = new FieldValueHandlerImpl();
            const holder = new FieldValueHolder(handler, "102", onChange);
            expect(holder.fieldValue).to.deep.equal({value: 102, textValue: "102", error: new Error('OOR!')});
        });
        it('can create field value from value', () => {
            const onChange = (value: FieldValue<any>) => {};
            const handler = new FieldValueHandlerImpl();
            const holder = new FieldValueHolder(handler, 79, onChange);
            expect(holder.fieldValue).to.deep.equal({value: 79, textValue: "79", error: undefined});
        });
        it('can create field value from value - error', () => {
            const onChange = (value: FieldValue<any>) => {};
            const handler = new FieldValueHandlerImpl();
            const holder = new FieldValueHolder(handler, 103, onChange);
            expect(holder.fieldValue).to.deep.equal({value: 103, textValue: "103", error: new Error('OOR!')});
        });
        it('can create field value from fieldValue', () => {
            const onChange = (value: FieldValue<any>) => {};
            const handler = new FieldValueHandlerImpl();
            const holder = new FieldValueHolder(handler, {value: 75}, onChange);
            expect(holder.fieldValue).to.deep.equal({value: 75});
        });

        it('setTextValue', () => {
            const changeTrace = [];
            const onChange = (value: FieldValue<any>) => {
                changeTrace.push(value);
            };
            const handler = new FieldValueHandlerImpl();
            const holder = new FieldValueHolder(handler, null, onChange);
            holder.setTextValue('13');
            expect(holder.textValue).to.equal('13');
            expect(holder.value).to.equal(13);
            expect(holder.error).to.be.undefined;
            expect(changeTrace).to.deep.equal([{value: 13, textValue: '13', error: undefined}]);
            expect(handler.trace).to.deep.equal([
                ["formatValue", null],
                ["validateValue", null],
                ["parseValue", "13"],
                ["validateValue", 13]
            ]);
        });
        it('setTextValue with error', () => {
            const changeTrace = [];
            const onChange = (value: FieldValue<any>) => {
                changeTrace.push(value);
            };
            const handler = new FieldValueHandlerImpl();
            const holder = new FieldValueHolder(handler, null, onChange);
            holder.setTextValue('1.3');
            expect(holder.textValue).to.equal('1.3');
            expect(holder.value).to.equal(null);
            expect(holder.error + '').to.equal('Error: Oh, oh!');
            expect(changeTrace).to.deep.equal([{value: null, textValue: '1.3', error: new Error('Oh, oh!')}]);
            expect(handler.trace).to.deep.equal([
                ["formatValue", null],
                ["validateValue", null],
                ["parseValue", "1.3"],
            ]);
        });
        it('setValue', () => {
            const changeTrace = [];
            const onChange = (value: FieldValue<any>) => {
                changeTrace.push(value);
            };
            const handler = new FieldValueHandlerImpl();
            const holder = new FieldValueHolder(handler, null, onChange);
            holder.setValue(14);
            expect(holder.textValue).to.equal('14');
            expect(holder.value).to.equal(14);
            expect(holder.error).to.be.undefined;
            expect(changeTrace).to.deep.equal([{value: 14, textValue: '14', error: undefined}]);
            expect(handler.trace).to.deep.equal([
                ["formatValue", null],
                ["validateValue", null],
                ["formatValue", 14],
                ["validateValue", 14],
            ]);
        });
        it('setValue with error', () => {
            const changeTrace = [];
            const onChange = (value: FieldValue<any>) => {
                changeTrace.push(value);
            };
            const handler = new FieldValueHandlerImpl();
            const holder = new FieldValueHolder(handler, null, onChange);
            holder.setValue(101);
            expect(holder.textValue).to.equal('101');
            expect(holder.value).to.equal(101);
            expect(holder.error + '').to.equal('Error: OOR!');
            expect(changeTrace).to.deep.equal([{value: 101, textValue: '101', error: new Error('OOR!')}]);
            expect(handler.trace).to.deep.equal([
                ["formatValue", null],
                ["validateValue", null],
                ["formatValue", 101],
                ["validateValue", 101],
            ]);
        });

    });
});
