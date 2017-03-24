import * as React from 'react';
import {IValueEditorProps} from "./ValueEditor";
import {Button} from "@blueprintjs/core";
import {GeometryInputDialog} from "../../components/GeometryInputDialog";
import {FieldValue, toTextValue} from "../../components/field/Field";
import {TextField} from "../../components/field/TextField";

interface IPolygonValueEditorProps extends IValueEditorProps<string> {
}

interface IPolygonValueEditorState {
    isDetailsEditorOpen: boolean;
}

// TODO (forman): complete me, i.e. add validation!


export class PolygonValueEditor extends React.Component<IPolygonValueEditorProps, IPolygonValueEditorState> {

    constructor(props: IPolygonValueEditorProps) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.state = {isDetailsEditorOpen: false};
    }

    onChange(value: FieldValue<string>) {
        this.props.onChange(this.props.input, value);
    }

    render() {
        return (
            <div className="pt-control-group" style={{flexGrow: 1, display: 'flex'}}>
                <TextField
                       value={this.props.value}
                       validator={validatePolygonText}
                       size={36}
                       placeholder='Enter <E>, <S>, <W>, <N> or WKT'
                       onChange={this.onChange}
                />

                <Button className="pt-intent-primary" style={{flex: 'none'}}
                        onClick={() => this.setState({isDetailsEditorOpen: true})}>...</Button>

                <GeometryInputDialog isOpen={this.state.isDetailsEditorOpen}
                                     value={toTextValue(this.props.value)}
                                     onConfirm={(value: string) => {
                                         this.setState({isDetailsEditorOpen: false});
                                         this.onChange({textValue: value, value: value});
                                     }}
                                     onCancel={() => {
                                         this.setState({isDetailsEditorOpen: false});
                                     }}
                                     geometryType={'Polygon'}/>
            </div>
        );
    }
}


export function validatePolygonText(value: string) {
    value = value.trim().toUpperCase();
    if (value === '') {
        return;
    }
    if (value[0] >= 'A' && value[0] <= 'Z') {
        if (!value.startsWith('POLYGON')) {
            throw new Error('Polygon WKT must start with "POLYGON".')
        }
        // Quick and dirty WKT validation
        let coordCount = 0;
        let depthCount = 0;
        let maxDepthCount = 0;
        for (let i = 0; i < value.length; i++) {
            const c = value[i];
            if (c === '(') {
                depthCount++;
                if (depthCount > 2) {
                    throw new Error('Invalid WKT, too many "(".');
                }
                maxDepthCount = Math.max(maxDepthCount, depthCount);
            } else if (c === ')') {
                depthCount--;
                if (depthCount < 0) {
                    throw new Error('Invalid WKT, too many ")".');
                }
                if (depthCount === 0) {
                    if (coordCount < 3) {
                        throw new Error('Invalid WKT, too few coordinates.');
                    }
                    coordCount = 0;
                }
            } else if (c === ',') {
                coordCount++;
            }
        }
        if (depthCount !== 0) {
            throw new Error('Invalid WKT, too many "(".');
        }
        if (maxDepthCount < 2) {
            throw new Error('Invalid WKT, too few "(".');
        }
    } else {
        const bboxCoords = value.split(',');
        if (bboxCoords.length !== 4) {
            throw new Error('Bounding box must use "<E>, <S>, <W>, <N>" syntax.');
        }
        for (let bboxCoord of bboxCoords) {
            parseFloat(bboxCoord.trim());
        }
    }
}
