import * as React from 'react'


export interface IPanelProps {
    id: string;
    title: string;
    iconName: string;
    body?: JSX.Element|null;
}

/**
 * A Panel is a child element of a PanelContainer.
 *
 * @author Norman Fomferra
 */
export class Panel extends React.PureComponent<IPanelProps, any> {
    constructor(props: IPanelProps) {
        super(props);
    }

    //noinspection JSMethodCanBeStatic
    shouldComponentUpdate() {
        return false;
    }

    render() {
        return null;
    }
}
