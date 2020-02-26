import * as React from 'react';
import { CSSProperties } from 'react';
import { AnchorButton, IconName, Intent, PopoverPosition, Tooltip } from '@blueprintjs/core';

export interface IToolButtonProps {
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    icon?: IconName;
    intent?: Intent;
    tooltipContent?: JSX.Element | string;
    tooltipPosition?: PopoverPosition;
    style?: CSSProperties;
    text?: string;
    active?: boolean;
    large?: boolean;
}

export function ToolButton(props: IToolButtonProps) {
    let className;
    if (!props.large) {
        className = 'bp3-small';
    }
    if (props.className && props.className !== '') {
        className = `${className} ${props.className}`;
    }
    const button = (
        <AnchorButton className={className}
                      onClick={props.onClick}
                      disabled={props.disabled}
                      icon={props.icon}
                      intent={props.intent}
                      style={props.style}
                      text={props.text}
                      active={props.active}
        />
    );
    if (props.tooltipContent) {
        return (
            <Tooltip content={props.tooltipContent}
                     position={props.tooltipPosition || PopoverPosition.AUTO}>{button}</Tooltip>
        );
    } else {
        return button;
    }
}
