import * as React from 'react'
import {Menu, MenuItem, MenuDivider, Popover, Position } from "@blueprintjs/core";

interface IPanelProps {
    icon?: string;
    text: string;
    isSelected?: boolean;
    isOpen?: boolean;
    onSelectedStateChanged?: (isSelected: boolean) => any;
    onOpenStateChanged?: (isOpen: boolean) => any;
}

interface IPanelState {
    isSelected: boolean;
    isOpen: boolean;
    isMenuShown: boolean;
}

export class Panel extends React.Component<IPanelProps,IPanelState> {
    constructor(props: IPanelProps) {
        super(props);
        this.state = {
            isSelected: props.isSelected || false,
            isOpen: props.isOpen || false,
            isMenuShown: false,
        };
        this.handleTitleClicked = this.handleTitleClicked.bind(this);
        this.handleMenuButtonClicked = this.handleMenuButtonClicked.bind(this);
        this.handleCollapseButtonClicked = this.handleCollapseButtonClicked.bind(this);
    }

    handleTitleClicked() {
        //noinspection JSUnusedLocalSymbols
        this.setState((state: IPanelState, props: IPanelProps) => {
            let newState = {
                isSelected: !state.isSelected,
                isMenuShown: state.isMenuShown,
                isOpen: state.isOpen
            };
            if (this.props.onSelectedStateChanged) {
                this.props.onSelectedStateChanged(newState.isSelected);
            }
            return newState;
        });
    }

    handleMenuButtonClicked() {
        //noinspection JSUnusedLocalSymbols
        this.setState((state: IPanelState, props: IPanelProps) => {
            return {
                isSelected: state.isSelected,
                isMenuShown: !state.isMenuShown,
                isOpen: state.isOpen
            };
        });
    }

    handleCollapseButtonClicked() {
        //noinspection JSUnusedLocalSymbols
        this.setState((state: IPanelState, props: IPanelProps) => {
            let newState = {
                isSelected: state.isSelected,
                isMenuShown: state.isMenuShown,
                isOpen: !state.isOpen
            };
            if (this.props.onOpenStateChanged) {
                this.props.onOpenStateChanged(newState.isOpen);
            }
            return newState;
        });
    }

    // TODO: honour selection state
    render() {
        const menu = (
            <Menu>
                <MenuItem iconName="graph" text="Graph" />
                <MenuItem iconName="map" text="Map" />
                <MenuItem iconName="th" text="Table" shouldDismissPopover={false} />
                <MenuItem iconName="zoom-to-fit" text="Nucleus" disabled={true} />
                <MenuDivider />
                <MenuItem iconName="cog" text="Settings...">
                    <MenuItem iconName="add" text="Add new application" disabled={true} />
                    <MenuItem iconName="remove" text="Remove application" />
                </MenuItem>
            </Menu>
        );
        const menuIcon = <span className="pt-icon-standard pt-icon-more" onClick={this.handleMenuButtonClicked}/>;

        const collapseIcon =this. state.isOpen ? "pt-icon-chevron-down" : "pt-icon-chevron-up";

        return (<div className="cate-panel">
            <span className="cate-panel-title" onClick={this.handleTitleClicked}>{this.props.text}</span>
            <Popover isOpen={this.state.isMenuShown} content={menu} position={Position.RIGHT_BOTTOM}>
                {menuIcon}
            </Popover>
            <span className={"pt-icon-standard " + collapseIcon} onClick={this.handleCollapseButtonClicked}/>
        </div>);
    }
}
