import * as React from 'react';
import {IValueEditorProps, ValueEditorValue} from "./ValueEditor";
import {Button} from "@blueprintjs/core";
import {GeometryInputDialog} from "../../components/GeometryInputDialog";
import {FieldValue} from "../../components/field/Field";

interface IPolygonValueEditorProps extends IValueEditorProps<string> {
}

interface IPolygonValueEditorState {
    value: ValueEditorValue<string>;
    isDetailsEditorOpen: boolean;
}

// TODO (forman): complete me, i.e. add validation!


export class PolygonValueEditor extends React.Component<IPolygonValueEditorProps, IPolygonValueEditorState> {

    constructor(props: IPolygonValueEditorProps) {
        super(props);
        this.state = {isDetailsEditorOpen: false, value: this.props.value};
    }

    render() {
        let textValue = (this.state.value && (this.state.value as FieldValue<string>).textValue) || (this.state.value as any) || '';
        return (
            <div className="pt-control-group" style={{flexGrow: 1, display: 'flex'}}>
                <input className="pt-input"
                       type="text"
                       value={textValue}
                       size={40}
                       placeholder='<E>, <S>, <W>, <N> or well-known text (WKT)'
                       onChange={(event: any) => this.props.onChange(this.props.input, {
                           textValue: event.target.value,
                           value: event.target.value
                       })}
                />

                <Button className="pt-intent-primary" style={{flex: 'none'}}
                        onClick={() => this.setState({isDetailsEditorOpen: true} as any)}>...</Button>

                <GeometryInputDialog isOpen={this.state.isDetailsEditorOpen}
                                     value={textValue}
                                     onConfirm={(value: string) => {
                                         const fieldValue = {textValue: value, value: value};
                                         this.setState({isDetailsEditorOpen: false, value: fieldValue} as any);
                                         this.props.onChange(this.props.input, fieldValue);
                                     }}
                                     onCancel={() => {
                                         this.setState({isDetailsEditorOpen: false} as any);
                                     }}
                                     geometryType={'Polygon'}/>
            </div>
        );
    }
}
