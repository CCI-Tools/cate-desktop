import * as React from "react"
import {Menu, MenuItem, MenuDivider, Popover, Position, Collapse} from "@blueprintjs/core";
import * as classNames from "classnames";

interface IPanelProps {
    icon?: string;
    text: string;
    isOpen?: boolean;
    onOpenStateChanged?: (isOpen: boolean) => any;
    isSelected?: boolean;
    onSelectedStateChanged?: (isSelected: boolean) => any;
    isExpanded?: boolean;
    onExpandedStateChanged?: (isExpanded: boolean) => any;
}

interface IPanelState {
    isOpen: boolean;
    isSelected: boolean;
    isExpanded: boolean;
    isMoreActive: boolean;
}

export class Panel extends React.Component<IPanelProps,IPanelState> {
    constructor(props: IPanelProps) {
        super(props);
        this.state = {
            isOpen: props.isOpen !== false,
            isSelected: props.isSelected || false,
            isExpanded: props.isExpanded || false,
            isMoreActive: false,
        };
        this.handleTitleClicked = this.handleTitleClicked.bind(this);
        this.handleMoreButtonClicked = this.handleMoreButtonClicked.bind(this);
        this.handleExpandButtonClicked = this.handleExpandButtonClicked.bind(this);
        this.handleCloseButtonClicked = this.handleCloseButtonClicked.bind(this);
    }

    handleTitleClicked() {
        //noinspection JSUnusedLocalSymbols
        this.setState((state: IPanelState, props: IPanelProps) => {
            let newState = {
                isOpen: state.isOpen,
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
                isOpen: state.isOpen,
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
                isOpen: state.isOpen,
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

    handleCloseButtonClicked() {
        //noinspection JSUnusedLocalSymbols
        this.setState((state: IPanelState, props: IPanelProps) => {
            let newState = {
                isOpen: false,
                isSelected: state.isSelected,
                isExpanded: state.isExpanded,
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

        const panelClassNames = classNames("cate-panel", {
            'opened': this.state.isOpen,
            'closed': !this.state.isOpen,
        });

        const menuIconName = "pt-icon-properties";
        const expandIconName = this.state.isExpanded ? "pt-icon-chevron-up" : "pt-icon-chevron-down";
        const closeIconName = "pt-icon-cross";

        let icon = null;
        if (this.props.icon) {
            const iconClasses = classNames("pt-icon-standard", this.props.icon);
            icon = <span className={iconClasses} onClick={this.handleTitleClicked}/>;
        }
        const title = <span className="cate-panel-title" onClick={this.handleTitleClicked}>{this.props.text}</span>;

        const menuIcon = (
            <Popover isOpen={this.state.isMoreActive} content={menu}>
                <span className={"pt-icon-standard " + menuIconName + " cate-icon-small"}
                      onClick={this.handleMoreButtonClicked}/>
            </Popover>);
        const expandIcon = (<span className={"pt-icon-standard " + expandIconName + " cate-icon-small"}
                                  onClick={this.handleExpandButtonClicked}/>);
        const closeIcon = (<span className={"pt-icon-standard " + closeIconName + " cate-icon-small"}
                                 onClick={this.handleCloseButtonClicked}/>);

        return (
            <div className={panelClassNames}>
                <div className="cate-panel-header">
                    {icon}
                    {title}
                    {menuIcon}
                    {expandIcon}
                    {closeIcon}
                </div>
                <Collapse isOpen={this.state.isExpanded}>
                    {this.props.children}
                </Collapse>
            </div>
        );
    }
}
