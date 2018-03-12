import * as React from 'react';
import AceEditor from 'react-ace';
import {ModalDialog} from "./ModalDialog";

import 'brace/mode/python';
import 'brace/theme/monokai';

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
    private static readonly DIALOG_STYLE: React.CSSProperties = {width: "54em"};

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

    onChange(value: string) {
        console.log("onChange: value =", value);
        this.setState(this.toState(value));
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
                         renderBody={this.renderBody}
                         style={ScriptDialog.DIALOG_STYLE}
            />
        );
    }

    renderBody() {
        if (!this.props.isOpen) {
            return null;
        }

        const value = this.state.value;
        const hasError = !!this.state.error;
        return (
            <AceEditor mode={this.props.scriptLang}
                       theme="monokai"
                       width={"100%"}
                       fontSize={14}
                       showGutter={true}
                       highlightActiveLine={true}
                       value={value}
                       onChange={this.onChange}
            />
        );
    }

}

