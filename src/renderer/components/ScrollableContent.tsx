import * as React from 'react'

interface IScrollablePanelContentProps {
    children?: JSX.Element[];
}

const STYLE = {width: '100%', height: '100%', overflow: 'auto'};

export function ScrollablePanelContent(props: IScrollablePanelContentProps) {
    return (<div style={STYLE}>{props.children}</div>);
}
