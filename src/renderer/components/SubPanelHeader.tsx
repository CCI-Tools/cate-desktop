import * as React from 'react';
import {CSSProperties} from 'react';

export interface ISubPanelHeaderProps {
    title: string;
    divStyle?: React.CSSProperties;
    titleStyle?: React.CSSProperties;
}

/**
 * A header for a sub-panel component.
 *
 * @author Hans Permana
 */
export class SubPanelHeader extends React.PureComponent<ISubPanelHeaderProps, any> {
    static readonly DIV_STYLE: CSSProperties = {
        margin: '10px 0', padding: '0 5px', backgroundColor: '#3c5161'
    };

    static readonly SPAN_STYLE: CSSProperties = {
        color: '#aaafaf', fontSize: '12px', fontWeight: 100
    };

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div
                style={this.props.divStyle ? {...SubPanelHeader.DIV_STYLE, ...this.props.divStyle} : SubPanelHeader.DIV_STYLE}>
                <span
                    style={this.props.titleStyle ? {...SubPanelHeader.SPAN_STYLE, ...this.props.titleStyle} : SubPanelHeader.SPAN_STYLE}>
                    {this.props.title}
                </span>
            </div>
        );
    }
}
