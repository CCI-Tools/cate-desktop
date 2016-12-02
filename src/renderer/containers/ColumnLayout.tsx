import * as React from 'react'
import {Splitter} from "../components/Splitter";


export class ColumnLayoutTop extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-header">
                {this.props.children}
            </div>
        );
    }
}

export class ColumnLayoutBottom extends React.Component<any, any> {
    render() {
        return (
            <div className="hgl-footer">
                {this.props.children}
            </div>
        );
    }
}

