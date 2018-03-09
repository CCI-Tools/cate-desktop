import * as React from 'react';
import {CSSProperties} from "react";
import {AnchorButton, IconName, Tooltip, Position} from "@blueprintjs/core";

export interface IToolButtonProps {
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    iconName?: IconName;
    tooltipContent?: JSX.Element | string;
    tooltipPosition?: Position;
    style?: CSSProperties;
    text?: string;
    active?: boolean;
    large?: boolean;
}

export function ToolButton(props: IToolButtonProps) {
    let className;
    if (!props.large) {
        className = "pt-small";
    }
    if (props.className && props.className !== "") {
        className = `${className} ${props.className}`;
    }
    const button = (
        <AnchorButton className={className}
                      onClick={props.onClick}
                      disabled={props.disabled}
                      iconName={props.iconName}
                      style={props.style}
                      text={props.text}
                      active={props.active}
        />
    );
    if (props.tooltipContent) {
        return (
            <Tooltip content={props.tooltipContent} position={props.tooltipPosition}>{button}</Tooltip>
        );
    } else {
        return button;
    }
}
