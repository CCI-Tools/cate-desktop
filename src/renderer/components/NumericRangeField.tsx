import * as React from 'react'

export type NumericRange = [number, number];

export interface INumericRangeFieldProps {
    value: NumericRange;
    onChange: (value: NumericRange) => void;
    exponential?: boolean;
    fractionDigits?: number;
    className?: string;
    style?: {[key:string]: any};
}

export interface INumericRangeFieldState {
    value: NumericRange;
    inputValue: string;
}


/**
 * A NumericRangeField is an input field that provides a numeric range of two number values (x1 and x2 properties).
 * It notifies a parent (onChange property) only if the the RETURN key is pressed or the input field looses its focus.
 *
 * @author Norman Fomferra
 */
export class NumericRangeField extends React.Component<INumericRangeFieldProps, INumericRangeFieldState> {

    private initialState: INumericRangeFieldState;

    constructor(props: INumericRangeFieldProps) {
        super(props);
        this.state = this.propsToState(props);
        this.initialState = this.state;
        this.handleChange =  this.handleChange.bind(this);
        this.handleFocusOut =  this.handleFocusOut.bind(this);
        this.handleKeyUp =  this.handleKeyUp.bind(this);
    }

    componentWillReceiveProps(nextProps: INumericRangeFieldProps): void {
        const state = this.propsToState(nextProps);
        this.setState(state);
        this.initialState = state;
    }

    render() {
        const className = "pt-input " + (this.props.className || '');
        const style = Object.assign({width: "10em", textAlign: "right"}, this.props.style);
        return (
            <input className={className}
                   type="text"
                   style={style}
                   value={this.state.inputValue}
                   onChange={(ev: any) => this.handleChange(ev.target.value)}
                   onKeyUp={(ev: any) => this.handleKeyUp(ev.keyCode)}
                   onBlur={(ev: any) => this.handleFocusOut()}
            />
        );
    }

    private handleChange(inputValue: string) {
        this.setState({inputValue} as INumericRangeFieldState)
    }

    private handleKeyUp(keyCode: number) {
        if (keyCode == 13) {
            // RETURN pressed
            this.acceptInputValue();
        } else if (keyCode == 27) {
            // ESCAPE pressed
            this.rejectInputValue();
        }
    }

    private handleFocusOut() {
        // accept current value, but set initial value if input is invalid
        this.acceptInputValue(this.rejectInputValue.bind(this));
    }

    private acceptInputValue(onFailure?: () => void): boolean {
        const pair = (this.state.inputValue || '').split(',');
        if (pair.length == 2) {
            try {
                let x1 = parseFloat(pair[0]);
                let x2 = parseFloat(pair[1]);
                if (x2 < x1) {
                    const t = x1;
                    x1 = x2;
                    x2 = t;
                }
                const value: NumericRange = [x1, x2];
                this.setState({value, inputValue: this.formatValue(value)}, this.notify.bind(this));
                return true;
            } catch (e) {
                console.warn(`NumericRangeField: ignoring invalid user input "${this.state.inputValue}":`, e);
            }
        }
        if (onFailure) {
            onFailure();
        }
        return false;
    }

    private rejectInputValue() {
        this.setState(this.initialState, this.notify.bind(this));
    }

    private notify() {
        if (this.props.onChange) {
            this.props.onChange(this.state.value);
        }
    }

    private propsToState(props: INumericRangeFieldProps): INumericRangeFieldState {
        const value = props.value.slice() as NumericRange;
        const inputValue = this.formatValue(value);
        return {value, inputValue};
    }

    private formatValue(value: NumericRange): string {
        return this.formatNumber(value[0]) + ", " + this.formatNumber(value[1]);
    }

    private formatNumber(x: number): string {
        const d = this.props.fractionDigits || 0;
        return this.props.exponential ? x.toExponential(d) : x.toFixed(d)
    }
}
