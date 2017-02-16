import * as React from 'react';

/**
 * A card is a bounded unit of UI content with a solid background color.
 *
 * See http://blueprintjs.com/docs/#components.card
 *
 * @author Norman Fomferra
 */
export class Card extends React.PureComponent<any, any> {
    constructor(props) {
        super(props);
    }

    render() {
        const cardStyle = {
            overflowY: 'auto', flex: 'auto', maxHeight: '100%',
            padding: '0.4em', margin: '4px'
        };
        return (
            <div className="pt-elevation-2" style={cardStyle}>
                {this.props.children}
            </div>
        );
    }
}
