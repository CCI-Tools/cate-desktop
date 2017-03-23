import * as React from 'react';
import {IValueEditorProps} from "./ValueEditor";

interface IPointValueEditorProps extends IValueEditorProps<string> {
}

// TODO (forman): complete me, i.e. use details editor, add validation!

export class PointValueEditor extends React.Component<IPointValueEditorProps, null> {
    render() {
        let value = (this.props.value as any) || '';
        return (
            <input className="pt-input"
                   type="text"
                   style={{flexGrow: 1}}
                   value={value}
                   width="16em"
                   placeholder='Longitude, Latitude'
                   onChange={(event: any) => this.props.onChange(this.props.input, event.target.value)}
            />
        );
    }
}
