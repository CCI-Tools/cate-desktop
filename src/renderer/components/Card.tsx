import * as React from 'react';

/**
 * A card is a bounded unit of UI content with a solid background color.
 *
 * See http://blueprintjs.com/docs/#components.card
 *
 * @author Norman Fomferra
 */
export class Card extends React.Component<any, any> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div style={{overflowY: 'auto', flex: 'auto', maxHeight: '100%'}}>
                <div className="pt-card pt-elevation-2">
                    {this.props.children}
                </div>
            </div>
        );
    }
}
