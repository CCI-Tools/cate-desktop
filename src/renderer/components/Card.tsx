import * as React from 'react';
import {CSSProperties} from "react";

/**
 * A card is a bounded unit of UI content with a solid background color.
 *
 * See http://blueprintjs.com/docs/#components.card
 *
 * @author Norman Fomferra
 */
export class Card extends React.PureComponent<any, any> {
    static readonly DIV_STYLE: CSSProperties = {
        overflowY: "auto", flex: 'auto', maxHeight: '100%',
        padding: '0.4em', margin: '4px', marginBottom: '12px'
    };

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div className="pt-elevation-2" style={Card.DIV_STYLE}>
                {this.props.children}
            </div>
        );
    }
}
