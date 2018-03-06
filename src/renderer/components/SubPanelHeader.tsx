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
        margin: '12px 0 6px 0', padding: '2px 6px', backgroundColor: '#3c5161'
    };

    static readonly SPAN_STYLE: CSSProperties = {
        color: '#aaafaf', fontSize: '0.9em', fontWeight: 100
    };

    constructor(props) {
        super(props);
    }

    render() {
        const divStyle = this.props.divStyle ? {...SubPanelHeader.DIV_STYLE, ...this.props.divStyle} : SubPanelHeader.DIV_STYLE;
        const titleStyle = this.props.titleStyle ? {...SubPanelHeader.SPAN_STYLE, ...this.props.titleStyle} : SubPanelHeader.SPAN_STYLE;
        return (
            <div style={divStyle}>
                <span style={titleStyle}>{this.props.title}</span>
            </div>
        );
    }
}
