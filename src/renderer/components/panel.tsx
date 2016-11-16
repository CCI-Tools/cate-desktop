import * as React from 'react'
import {Menu, MenuItem, MenuDivider, Popover, Position, Collapse} from "@blueprintjs/core";

interface IPanelProps {
    icon?: string;
    text: string;
    isSelected?: boolean;
    onSelectedStateChanged?: (isSelected: boolean) => any;
    isExpanded?: boolean;
    onExpandedStateChanged?: (isOpen: boolean) => any;
}

interface IPanelState {
    isSelected: boolean;
    isExpanded: boolean;
    isMoreActive: boolean;
}

export class Panel extends React.Component<IPanelProps,IPanelState> {
    constructor(props: IPanelProps) {
        super(props);
        this.state = {
            isSelected: props.isSelected || false,
            isExpanded: props.isExpanded || false,
            isMoreActive: false,
        };
        this.handleTitleClicked = this.handleTitleClicked.bind(this);
        this.handleMoreButtonClicked = this.handleMoreButtonClicked.bind(this);
        this.handleExpandButtonClicked = this.handleExpandButtonClicked.bind(this);
    }

    handleTitleClicked() {
        //noinspection JSUnusedLocalSymbols
        this.setState((state: IPanelState, props: IPanelProps) => {
            let newState = {
                isSelected: !state.isSelected,
                isExpanded: state.isExpanded,
                isMoreActive: state.isMoreActive
            };
            if (this.props.onSelectedStateChanged) {
                this.props.onSelectedStateChanged(newState.isSelected);
            }
            return newState;
        });
    }

    handleMoreButtonClicked() {
        //noinspection JSUnusedLocalSymbols
        this.setState((state: IPanelState, props: IPanelProps) => {
            return {
                isSelected: state.isSelected,
                isExpanded: state.isExpanded,
                isMoreActive: !state.isMoreActive
            };
        });
    }

    handleExpandButtonClicked() {
        //noinspection JSUnusedLocalSymbols
        this.setState((state: IPanelState, props: IPanelProps) => {
            let newState = {
                isSelected: state.isSelected,
                isExpanded: !state.isExpanded,
                isMoreActive: state.isMoreActive
            };
            if (this.props.onExpandedStateChanged) {
                this.props.onExpandedStateChanged(newState.isExpanded);
            }
            return newState;
        });
    }

    // TODO: honour selection state
    render() {
        const menu = (
            <Menu>
                <MenuItem iconName="graph" text="Graph"/>
                <MenuItem iconName="map" text="Map"/>
                <MenuItem iconName="th" text="Table" shouldDismissPopover={false}/>
                <MenuItem iconName="zoom-to-fit" text="Nucleus" disabled={true}/>
                <MenuDivider />
                <MenuItem iconName="cog" text="Settings...">
                    <MenuItem iconName="add" text="Add new application" disabled={true}/>
                    <MenuItem iconName="remove" text="Remove application"/>
                </MenuItem>
            </Menu>
        );

        const menuIcon = this.state.isMoreActive ? "pt-icon-menu-open" : "pt-icon-menu-closed";
        const expandIcon = this.state.isExpanded ? "pt-icon-chevron-up" : "pt-icon-chevron-down";

        return (
            <div>
                <div className="cate-panel">
                    <span className="cate-panel-title" onClick={this.handleTitleClicked}>{this.props.text}</span>
                    <Popover isOpen={this.state.isMoreActive} content={menu} position={Position.RIGHT_BOTTOM}>
                        <span className={"pt-icon-standard " + menuIcon} onClick={this.handleMoreButtonClicked}/>
                    </Popover>
                    <span className={"pt-icon-standard " + expandIcon} onClick={this.handleExpandButtonClicked}/>
                </div>
                <Collapse isOpen={this.state.isExpanded}>
                    {this.props.children}
                </Collapse>
            </div>
        );
    }
}
