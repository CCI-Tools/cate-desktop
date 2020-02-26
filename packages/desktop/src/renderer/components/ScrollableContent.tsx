import * as React from 'react'
import { CSSProperties, ReactNode } from 'react'

interface IScrollablePanelContentProps {
    children?: ReactNode;
}

const STYLE: CSSProperties = {width: '100%', height: '100%', overflow: 'auto'};

export function ScrollablePanelContent(props: IScrollablePanelContentProps) {
    return (<div style={STYLE}>{props.children}</div>);
}
