import * as React from 'react';
import {Label} from "@blueprintjs/core";
import {ModalDialog} from "./ModalDialog";

interface IScriptDialogProps {
    isOpen: boolean;
    value: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
    scriptLang: string;
}

interface IScriptDialogState {
    value?: string;
    error?: Error;
}


export class ScriptDialog extends React.Component<IScriptDialogProps, IScriptDialogState> {
    static readonly NOMINAL_CLASS = "pt-input pt-fill";
    static readonly ERROR_CLASS = "pt-input pt-fill pt-intent-danger";

    constructor(props: IScriptDialogProps) {
        super(props);
        this.renderBody = this.renderBody.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.onChange = this.onChange.bind(this);
        this.state = this.toState(this.props.value);
    }

    componentWillReceiveProps(props: IScriptDialogProps) {
        this.setState(this.toState(props.value));
    }

    onConfirm() {
        this.props.onConfirm(this.state.value);
    }

    onChange(ev: any) {
        this.setState(this.toState(ev.target.value));
    }

    canConfirm(): boolean {
        return !this.state.error;
    }

    private toState(value: any) {
        let error;
        try {
            // TODO (nf)
            // validateScriptValue(value, this.props.scriptLang);
        } catch (e) {
            error = e;
        }
        return {value, error};
    }

    render() {
        return (
            <ModalDialog isOpen={this.props.isOpen}
                         title="Script Editor"
                         onCancel={this.props.onCancel}
                         onConfirm={this.onConfirm}
                         canConfirm={this.canConfirm}
                         renderBody={this.renderBody}/>
        );
    }

    renderBody() {
        if (!this.props.isOpen) {
            return null;
        }

        const value = this.state.value;
        const hasError = !!this.state.error;
        return (
            <div className="pt-form-group">
                <Label text={`Enter ${this.props.scriptLang} source code`}>
                    <div className="pt-form-content" style={{width: "100%"}}>
                    <textarea id="wkt"
                              className={hasError ? ScriptDialog.ERROR_CLASS : ScriptDialog.NOMINAL_CLASS}
                              rows={16}
                              value={value}
                              onChange={this.onChange}/>
                    </div>
                </Label>
            </div>
        );
    }

}

