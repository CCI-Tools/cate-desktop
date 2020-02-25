import * as React from 'react';
import { ModalDialog } from './ModalDialog';
import { GeometryType, validateGeometryValue } from '../../common/geometry-util';
import { FormGroup, Label } from '@blueprintjs/core';

interface IGeometryDialogProps {
    isOpen: boolean;
    value: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
    geometryType: GeometryType;
}

interface IGeometryDialogState {
    value?: string;
    error?: Error;
}

const WKT_LINK = (
    <a href="https://en.wikipedia.org/wiki/Well-known_text" target="_blank" rel="noopener noreferrer">Well-Known Text
        (WKT)</a>);

export class GeometryDialog extends React.Component<IGeometryDialogProps, IGeometryDialogState> {
    static readonly NOMINAL_CLASS = 'bp3-input bp3-fill';
    static readonly ERROR_CLASS = 'bp3-input bp3-fill bp3-intent-danger';

    constructor(props: IGeometryDialogProps) {
        super(props);
        this.renderBody = this.renderBody.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.onChange = this.onChange.bind(this);
        this.state = this.toState(this.props.value);
    }

    componentWillReceiveProps(props: IGeometryDialogProps) {
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
            validateGeometryValue(value, this.props.geometryType);
        } catch (e) {
            error = e;
        }
        return {value, error};
    }

    render() {
        return (
            <ModalDialog isOpen={this.props.isOpen}
                         title="Geometry Editor"
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
            <FormGroup>
                <Label htmlFor="wkt">
                    {`Enter Geometry of type ${this.props.geometryType}`}
                    <span className="bp3-text-muted"> (WGS84 coordinates in degree)</span>
                </Label>
                <div className="bp3-form-content" style={{width: '100%'}}>
                    <textarea id="wkt"
                              className={hasError ? GeometryDialog.ERROR_CLASS : GeometryDialog.NOMINAL_CLASS}
                              rows={10}
                              dir="auto"
                              value={value}
                              onChange={this.onChange}/>
                    {this.getHelpText()}
                </div>
            </FormGroup>
        );
    }

    getHelpText() {
        let errorText;
        if (this.state.error) {
            errorText = (<p>{`Error: ${this.state.error.message}`}</p>);
        }

        let helpText;
        if (this.props.geometryType === 'Point') {
            helpText = (<p>Use <code>lon, lat</code> or use {this.props.geometryType} {WKT_LINK} syntax.</p>);
        }
        else if (this.props.geometryType === 'Polygon') {
            helpText = (
                <p>Use <code>west, south, east, north</code> or use {this.props.geometryType} {WKT_LINK} syntax.</p>);
        } else {
            helpText = (<p>Use {this.props.geometryType} {WKT_LINK} syntax.</p>);
        }

        return (<div className="bp3-form-helper-text">{errorText}{helpText}</div>);
    }
}

