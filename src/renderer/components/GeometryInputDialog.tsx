import * as React from 'react';
import {ModalDialog} from "./ModalDialog";


interface IGeometryInputDialogProps {
    isOpen: boolean;
    value: string;
    onConfirm: (value: string) => void;
    onCancel: () => void;
    geometryType: string;
}

interface IGeometryInputDialogState {
    value: string;
}

export class GeometryInputDialog extends React.Component<IGeometryInputDialogProps, IGeometryInputDialogState> {

    constructor(props: IGeometryInputDialogProps, context: any) {
        super(props, context);
        this.renderBody = this.renderBody.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.onValueChange = this.onValueChange.bind(this);
        this.state = {value: this.props.value};
    }

    onConfirm() {
        this.props.onConfirm(this.state.value);
    }

    onValueChange(ev: any) {
        this.setState({value: ev.target.value});
    }

    render() {
        return (
            <ModalDialog isOpen={this.props.isOpen}
                         title="Geometry Editor"
                         onConfirm={this.onConfirm}
                         onCancel={this.props.onCancel}
                         renderBody={this.renderBody}/>
        );
    }

    renderBody() {
        return (
            <div className="pt-form-group">
                <label className="pt-label" htmlFor="wkt">
                    Geometry text
                    <span className="pt-text-muted">{` (${this.props.geometryType})`}</span>
                </label>
                <div className="pt-form-content" style={{width: "30em"}}>
                    <textarea id="wkt" className="pt-input pt-fill" rows={8} dir="auto"
                              onChange={this.onValueChange}>
                        {this.props.value}
                    </textarea>
                    <div className="pt-form-helper-text">For points enter
                        a <strong>lon,lat</strong>, for bounding boxes you can
                        use <strong>min-lon,min-lat,max-lon,max-lat</strong> syntax.
                        For any other geometry types use the <strong><a
                            href="https://en.wikipedia.org/wiki/Well-known_text"
                        >well-known text (WKT)</a></strong> representation.
                    </div>
                </div>
            </div>
        );
    }
}
