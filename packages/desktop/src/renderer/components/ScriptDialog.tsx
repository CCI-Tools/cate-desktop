import * as React from 'react';
import AceEditor from 'react-ace';
import { ModalDialog } from './ModalDialog';

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


const LIBS = [
    {href: 'http://xarray.pydata.org/en/stable/api.html#top-level-functions', module: 'xr', name: 'xarray'},
    {href: 'http://xarray.pydata.org/en/stable/api.html#universal-functions', module: 'xu', name: 'xarray u-funcs'},
    {href: 'http://pandas.pydata.org/pandas-docs/stable/basics.html', module: 'pd', name: 'Pandas'},
    {href: 'http://pandas.pydata.org/pandas-docs/stable/basics.html', module: 'np', name: 'numpy'},
];

export class ScriptDialog extends React.Component<IScriptDialogProps, IScriptDialogState> {
    private static readonly DIALOG_STYLE: React.CSSProperties = {width: '54em'};

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
        console.log('onChange: value =', value);
        this.setState(this.toState(value));
    }

    canConfirm(): boolean {
        return !this.state.error;
    }

    // noinspection JSMethodCanBeStatic
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
        // const hasError = !!this.state.error;
        return (
            <React.Fragment>
                <AceEditor mode={this.props.scriptLang}
                           theme="monokai"
                           width={'100%'}
                           fontSize={14}
                           showGutter={true}
                           highlightActiveLine={true}
                           value={value}
                           onChange={this.onChange}
                />
                {this.getHelpText()}
            </React.Fragment>
        );
    }

    getHelpText() {

        const libText = LIBS.map((item, index) => (
            <span><code>{item.module}</code>&nbsp;(<a href={item.href}
                                                      rel="noopener noreferrer"
                                                      target="_blank">{item.name}</a>){index < LIBS.length - 1 ? ', ' : ''}</span>
        ));

        return (
            <div className="bp3-form-helper-text" style={{marginTop: '0.5em'}}>
                Please use Python 3.6+ syntax. The following modules are imported by default: {libText}. Other
                modules can be imported: <code>dask</code>, <code>gdal</code>, <code>geos</code> <code>pyshp</code>,
                <code>scipy</code>, <code>shapely</code>.
            </div>
        );
    }
}

