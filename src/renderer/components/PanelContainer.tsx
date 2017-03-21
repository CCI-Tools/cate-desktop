import * as React from 'react'
import ReactChild = React.ReactChild;
import {
    Colors,
    Position,
    Tooltip,
    MenuItem,
    MenuDivider,
    Menu,
    PopoverInteractionKind,
    Popover
} from "@blueprintjs/core";
import {Splitter} from "./Splitter";
import ReactElement = React.ReactElement;

type PanelSizeMap = {[panelId: string]: [number, number]};

export interface IPanelContainerProps {
    position?: "left"|"right";
    selectedPanelId?: string|null;
    panelSizes?: PanelSizeMap;
    onSelectedPanelChange?: (newPanelId: string|null, oldPanelId: string|null) => void;
    onPanelSizesChange?: (sizes: PanelSizeMap) => void;
}

export interface IPanelContainerState {
    selectedPanelId: string|null;
    panelSizes: PanelSizeMap;
}

/**
 * A PanelContainer comprises Panels.
 *
 * @author Norman Fomferra
 */
export class PanelContainer extends React.PureComponent<IPanelContainerProps, IPanelContainerState> {

    static readonly PANEL_ICON_SIZE = 20; // ==> because pt-icon-large = 20px
    static readonly PANEL_ICON_PADDING = 8;
    static readonly PANEL_BAR_SIZE = 2 * PanelContainer.PANEL_ICON_PADDING + PanelContainer.PANEL_ICON_SIZE;


    constructor(props: IPanelContainerProps) {
        super(props);
        this.onPanelSelected = this.onPanelSelected.bind(this);
        this.onPanelClose = this.onPanelClose.bind(this);
        this.onPanelSizeChange = this.onPanelSizeChange.bind(this);
        this.state = PanelContainer.mapPropsToState(props);
    }

    componentWillReceiveProps(props: IPanelContainerProps) {
        this.setState(PanelContainer.mapPropsToState(props));
    }

    static mapPropsToState(props: IPanelContainerProps): IPanelContainerState {
        return {
            selectedPanelId: props.selectedPanelId,
            panelSizes: Object.assign({}, props.panelSizes),
        };
    }

    private onPanelSelected(panelId: string) {
        let oldPanelId = this.state.selectedPanelId;
        const newPanelId = panelId === oldPanelId ? null : panelId;
        console.log("PanelContainer.onPanelSelected: ", newPanelId, oldPanelId);
        this.setState({selectedPanelId: newPanelId} as any, () => {
            if (this.props.onSelectedPanelChange) {
                this.props.onSelectedPanelChange(this.state.selectedPanelId, oldPanelId);
            }
        });
    }

    //noinspection JSUnusedLocalSymbols
    private onPanelClose(panelId: string) {
        this.onPanelSelected(null);
    }

    private onPanelSizeChange(delta: number) {
        const selectedPanelId = this.state.selectedPanelId;
        let panelSize = this.getPanelSize();
        let position = this.props.position || "left";
        if (position === "left") {
            panelSize[0] += delta;
        } else {
            panelSize[0] -= delta;
        }
        let panelSizes = Object.assign({}, this.state.panelSizes, {[selectedPanelId]: panelSize});
        console.log("PanelContainer.onSplitterChange: ", panelSizes);
        this.setState({panelSizes} as any, () => {
            if (this.props.onPanelSizesChange) {
                this.props.onPanelSizesChange(this.state.panelSizes);
            }
        });
    }

    private getPanelSize(): [number, number] {
        const selectedPanelId = this.state.selectedPanelId;
        const panelSize = selectedPanelId && this.state.panelSizes[selectedPanelId];
        return panelSize || [320, 320];
    }

    private getSelectedPanel(): JSX.Element|null {
        const selectedPanelId = this.state.selectedPanelId;
        if (!selectedPanelId) {
            return null;
        }
        let selectedPanel: JSX.Element = null;
        React.Children.forEach(this.props.children, (child: ReactChild) => {
            const panel = child as JSX.Element;
            if (panel.props && panel.props.id === selectedPanelId) {
                selectedPanel = panel;
            }
        });
        return selectedPanel;
    }

    render() {
        const panelContainerStyle = {
            display: "flex",
            flexFlow: "row nowrap",
            flex: "none",
            maxHeight: "100%",
        };

        const panelBar = <PanelBar panels={React.Children.toArray(this.props.children) as JSX.Element[]}
                                   barSize={PanelContainer.PANEL_BAR_SIZE}
                                   position={this.props.position}
                                   onPanelSelected={this.onPanelSelected}
                                   selectedPanelId={this.state.selectedPanelId}/>;
        const panelPane = <PanelPane panel={this.getSelectedPanel()}
                                     size={this.getPanelSize()}
                                     position={this.props.position}
                                     pinned={false}
                                     onSizeChange={this.onPanelSizeChange}
                                     onClose={this.onPanelClose}/>;

        const position = this.props.position || "left";
        if (position === "left") {
            return (
                <div style={panelContainerStyle}>
                    {panelBar}
                    {panelPane}
                </div>
            );
        } else {
            return (
                <div style={panelContainerStyle}>
                    {panelPane}
                    {panelBar}
                </div>
            );
        }
    }
}


interface IPanelHeaderProps {
    id: string;
    iconName: string;
    title: string;
    onClose: () => void;
}

function PanelHeader(props: IPanelHeaderProps): JSX.Element|null {
    const panelIcon = <span
        className={"pt-icon-standard " + props.iconName + " cate-panel-header-item"}/>;
    const panelTitle = <span
        className={"cate-panel-text cate-panel-header-item"}>{props.title.toUpperCase()}</span>;

    const panelMenu = (
        <Menu>
            <MenuItem text="Move up"/>
            <MenuItem text="Move down"/>
            <MenuDivider />
            <MenuItem text="Hide"/>
        </Menu>
    );

    const panelMenuIcon = (
        <Popover content={panelMenu} interactionKind={PopoverInteractionKind.CLICK}>
            <span className={"pt-icon-standard pt-icon-properties cate-icon-small cate-panel-header-item"}/>
        </Popover>
    );
    const panelCloseIcon = (
        <span className={"pt-icon-standard pt-icon-cross cate-icon-small cate-panel-header-item"}
              onClick={props.onClose}/>);

    return (
        <div className="cate-panel-header" style={{flex: "none"}}>
            {panelIcon}
            {panelTitle}
            {panelMenuIcon}
            {panelCloseIcon}
        </div>
    );
}


interface IPanelBarProps {
    panels: JSX.Element[];
    selectedPanelId: string|null;
    barSize: number;
    position: "left"|"right";
    onPanelSelected: (panelId: string) => void;
}

function PanelBar(props: IPanelBarProps) {
    const position = props.position || "left";
    const tooltipPos = position === "left" ? Position.RIGHT : Position.LEFT;
    const selectedPanelId = props.selectedPanelId;
    const barSize = props.barSize;
    const panels = props.panels || [];
    //noinspection JSMismatchedCollectionQueryUpdate
    const panelButtons: JSX.Element[] = [];
    const itemBaseStyle = {padding: PanelContainer.PANEL_ICON_PADDING};
    const itemNormalStyle = {...itemBaseStyle, color: Colors.GRAY4};
    const itemSelectedStyle = {...itemBaseStyle, color: Colors.WHITE, backgroundColor: Colors.DARK_GRAY5};
    for (let panel of panels) {
        if (!panel.props) {
            console.error('PanelBar children must be of type Panel');
            continue;
        }
        const panelId: string = panel.props.id;
        const panelTitle: string = panel.props.title;
        const panelIconName: string = panel.props.iconName;
        if (!panelId || !panelTitle || !panelIconName) {
            console.error('PanelBar children must have valid id, title, iconName properties');
            continue;
        }

        const selected = panelId === selectedPanelId;
        panelButtons.push(
            <li key={panelId}
                onClick={() => props.onPanelSelected(panelId)}
                style={selected ? itemSelectedStyle : itemNormalStyle}>
                <Tooltip content={panelTitle} position={tooltipPos} hoverOpenDelay={1500}>
                    <span className={"pt-icon-large " + panelIconName} style={{textAlign: "center", verticalAlign: "middle"}}/>
                </Tooltip>
            </li>
        );
    }

    return (
        <div
            style={{flex: "none", maxHeight: "100%", minWidth: barSize, overflow: "hidden", backgroundColor: Colors.DARK_GRAY2}}>
            <ul style={{listStyleType: "none", padding: 0, margin: 0, border: "none"}}>
                {panelButtons}
            </ul>
        </div>
    );
}

interface IPanelPaneProps {
    panel: JSX.Element|null;
    onClose: (panelId: string) => void;
    onSizeChange: (delta: number) => void;
    position: "left"|"right";
    size: [number, number];
    pinned: boolean;
}

function PanelPane(props: IPanelPaneProps) {
    const panel = props.panel;
    if (!panel || !panel.props || !panel.props.body) {
        return null;
    }

    const position = props.position || "left";
    const panelWidth = props.size[0];
    const pinnedMode = props.pinned;

    const panelId = panel.props.id;
    const panelBody = panel.props.body;

    let panelParentStyle = {
        flex: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        width: panelWidth,
        maxWidth: panelWidth,
        maxHeight: "100%",
    };

    let panelParent = (
        <div style={panelParentStyle}>
            <PanelHeader
                id={panelId}
                title={panel.props.title}
                iconName={panel.props.iconName}
                onClose={() => props.onClose(panelId)}
            />
            {panelBody}
        </div>
    );

    let pinnedModeStyle = {};
    if (pinnedMode) {
        if (position === "left") {
            pinnedModeStyle = {
                position: "absolute",
                top: 0,
                left: PanelContainer.PANEL_BAR_SIZE,
            };
        } else {
            pinnedModeStyle = {
                position: "absolute",
                top: 0,
                right: PanelContainer.PANEL_BAR_SIZE,
            };
        }
    }

    const panelPaneStyle = {
        paddingLeft: position === "left" ? 4 : 0,
        paddingRight: position === "left" ? 0 : 4,
        flex: "auto",
        display: "flex",
        flexFlow: "row nowrap",
        zIndex: 5,
        ...pinnedModeStyle
    };

    const splitter = <Splitter direction="hor" onChange={props.onSizeChange}/>;

    if (position === "left") {
        return (
            <div style={panelPaneStyle}>
                {panelParent}
                {splitter}
            </div>
        );
    } else {
        return (
            <div style={panelPaneStyle}>
                {splitter}
                {panelParent}
            </div>
        );
    }
}
