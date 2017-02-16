import * as React from 'react'

type ErrorHandler = (textValue: string, error: any) => void;

export interface IEditFieldProps<T> {
    value: T | null;
    onChange: (value: T) => void;
    onFailure?: ErrorHandler;
    parseValue?: (textValue: string) => T;
    formatValue?: (value: T) => string;
    placeholder?: string;
    textAlign?: string;
    columns?: number;
    className?: string;
    style?: {[key:string]: any};
}

export interface IEditFieldState<T> {
    value: T | null;
    inputValue: string;
}

/**
 * An EditField is an abstract text input field that provides a value of type T.
 * It notifies a parent (onChange property) only if the the RETURN key is pressed or the input field looses its focus.
 *
 * @author Norman Fomferra
 */
export abstract class EditField<T, P extends IEditFieldProps<T>> extends React.PureComponent<P, IEditFieldState<T>> {

    private initialState: IEditFieldState<T>;

    constructor(props: IEditFieldProps<T>) {
        super(props);
        this.state = this.propsToState(props);
        this.initialState = this.state;
        this.notifyStateChange = this.notifyStateChange.bind(this);
        this.rejectInputValue = this.rejectInputValue.bind(this);
        this.onFailure = this.onFailure.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleFocusOut = this.handleFocusOut.bind(this);
    }

    protected abstract parseValue(textValue: string): T;

    protected abstract formatValue(value: T): string;

    //noinspection JSUnusedLocalSymbols
    protected validateValue(value: T): void {
    }

    componentWillReceiveProps(nextProps: IEditFieldProps<T>): void {
        const state = this.propsToState(nextProps);
        this.setState(state);
        this.initialState = state;
    }

    private handleChange(event: any) {
        this.setState({inputValue: event.target.value} as IEditFieldState<T>)
    }

    private handleKeyUp(event: any) {
        const keyCode = event.keyCode;
        if (keyCode == 13) {
            // RETURN pressed
            this.acceptInputValue();
        } else if (keyCode == 27) {
            // ESCAPE pressed
            this.rejectInputValue();
        }
    }

    private handleFocusOut(event: any) {
        // accept current value, but set initial value if input is invalid
        this.acceptInputValue(this.onFailure);
    }

    render() {
        const className = "pt-input " + (this.props.className || '');
        let style = Object.assign({}, this.props.style);
        if (this.props.columns) {
            style['width'] = `${this.props.columns}em`;
        }
        if (this.props.textAlign) {
            style['textAlign'] = this.props.textAlign;
        }
        // TODO (forman): got this onBlur problem here: http://stackoverflow.com/questions/5614773/javascript-newbie-seems-that-onblur-of-one-element-is-overriding-the-onclick
        //   onBlur={(ev: any) => this.handleFocusOut()}
        //   onBlur={(ev: any) => setTimeout(this.handleFocusOut, 100)}

        return (
            <input className={className}
                   type="text"
                   style={style}
                   value={this.state.inputValue}
                   placeholder={this.props.placeholder}
                   onChange={this.handleChange}
                   onKeyUp={this.handleKeyUp}
                   onBlur={this.handleFocusOut}
            />
        );
    }

    private acceptInputValue(onFailure?: ErrorHandler): boolean {
        let textValue = this.state.inputValue;
        let value: T;
        try {
            value = this.parseValue(textValue);
            this.validateValue(value);
        } catch (e) {
            if (onFailure) {
                onFailure(textValue, e);
            } else if (this.props.onFailure) {
                this.props.onFailure(textValue, e);
            } else {
                console.warn(`EditField: no error handler given, ignoring invalid user input "${textValue}":`, e);
            }
            return false;
        }
        this.setState({value, inputValue: this.formatValue(value)}, this.notifyStateChange);
        return true;
    }

    private onFailure(textValue: string, error: any) {
        if (this.props.onFailure) {
            this.props.onFailure(textValue, error);
        }
        this.rejectInputValue();
    }

    private rejectInputValue() {
        this.setState(this.initialState, this.notifyStateChange);
    }

    private notifyStateChange() {
        if (this.props.onChange) {
            this.props.onChange(this.state.value);
        }
    }

    private propsToState(props: IEditFieldProps<T>): IEditFieldState<T> {
        let value = props.value;
        const inputValue = this.formatValue(value);
        if (value instanceof Array) {
            value = (value as any).slice();
        } else if (typeof value === 'object') {
            value = Object.assign({}, value);
        }
        return {value, inputValue};
    }
}
