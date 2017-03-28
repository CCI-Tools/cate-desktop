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

interface PanelContainerLayout {
    horPos: number;
    verPos: number;
}

type PanelSizeMap = { [panelId: string]: [number, number] };

export interface IPanelContainerProps {
    position?: "left" | "right";
    selectedTopPanelId?: string | null;
    selectedBottomPanelId?: string | null;
    onSelectedTopPanelChange?: (newPanelId: string | null, oldPanelId: string | null) => void;
    onSelectedBottomPanelChange?: (newPanelId: string | null, oldPanelId: string | null) => void;
    layout: PanelContainerLayout;
    onLayoutChange?: (layout: PanelContainerLayout) => void;
}

export interface IPanelContainerState {
    selectedTopPanelId: string | null;
    selectedBottomPanelId: string | null;
    layout: PanelContainerLayout;
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
        this.onTopPanelSelected = this.onTopPanelSelected.bind(this);
        this.onBottomPanelSelected = this.onBottomPanelSelected.bind(this);
        this.onTopPanelClose = this.onTopPanelClose.bind(this);
        this.onBottomPanelClose = this.onBottomPanelClose.bind(this);
        this.onPanelWidthChange = this.onPanelWidthChange.bind(this);
        this.state = PanelContainer.mapPropsToState(props);
    }

    componentWillReceiveProps(props: IPanelContainerProps) {
        this.setState(PanelContainer.mapPropsToState(props));
    }

    static mapPropsToState(props: IPanelContainerProps): IPanelContainerState {
        return {
            selectedTopPanelId: props.selectedTopPanelId,
            selectedBottomPanelId: props.selectedBottomPanelId,
            layout: props.layout,
        };
    }

    private onTopPanelSelected(panelId: string) {
        this.setState({selectedTopPanelId: panelId} as any, () => {
            if (this.props.onSelectedTopPanelChange) {
                this.props.onSelectedTopPanelChange(panelId, this.state.selectedBottomPanelId);
            }
        });
    }

    private onBottomPanelSelected(panelId: string) {
        this.setState({selectedBottomPanelId: panelId} as any, () => {
            if (this.props.onSelectedBottomPanelChange) {
                this.props.onSelectedBottomPanelChange(this.state.selectedTopPanelId, panelId);
            }
        });
    }

    private onTopPanelClose() {
        this.onTopPanelSelected(null);
    }

    private onBottomPanelClose() {
        this.onBottomPanelSelected(null);
    }

    private onPanelWidthChange(delta: number) {
        let horPos = this.state.layout.horPos;
        if ((this.props.position || "left") === "left") {
            horPos += delta;
        } else {
            horPos -= delta;
        }
        const layout = {...this.state.layout, horPos};
        this.setState({layout} as any, () => {
            if (this.props.onLayoutChange) {
                this.props.onLayoutChange(this.state.layout);
            }
        });
    }

    private getSelectedTopPanel(): JSX.Element | null {
        return this.findPanel(this.state.selectedTopPanelId);
    }

    private getSelectedBottomPanel(): JSX.Element | null {
        return this.findPanel(this.state.selectedTopPanelId);
    }

    private findPanel(id: string): JSX.Element | null {
        if (!id) {
            return null;
        }
        let selectedPanel: JSX.Element = null;
        React.Children.forEach(this.props.children, (child: ReactChild) => {
            const panel = child as JSX.Element;
            if (panel.props && panel.props.id === id) {
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
                                   selectedTopPanelId={this.state.selectedTopPanelId}
                                   selectedBottomPanelId={this.state.selectedBottomPanelId}
                                   onTopPanelSelected={this.onTopPanelSelected}
                                   onBottomPanelSelected={this.onBottomPanelSelected}
        />;
        const topPanelPane = <PanelPane panel={this.getSelectedTopPanel()}
                                     size={[this.state.width, this.state.height]}
                                     position={this.props.position}
                                     pinned={false}
                                     onSizeChange={this.onPanelWidthChange}
                                     onClose={this.onTopPanelClose}/>;
        const bottomPane = <PanelPane panel={this.getSelectedBottomPanel()}
                                        size={[this.state.width, this.state.height]}
                                        position={this.props.position}
                                        pinned={false}
                                        onSizeChange={this.onPanelWidthChange}
                                        onClose={this.onBottomPanelClose}/>;

        const position = this.props.position || "left";
        if (position === "left") {
            return (
                <div style={panelContainerStyle}>
                    {panelBar}
                    {topPanelPane}
                    {bottomPane}
                </div>
            );
        } else {
            return (
                <div style={panelContainerStyle}>
                    {topPanelPane}
                    {bottomPane}
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

function PanelHeader(props: IPanelHeaderProps): JSX.Element | null {
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

const PANELBAR_ITEMBASESTYLE = {padding: PanelContainer.PANEL_ICON_PADDING};
const PANEL_BAR_ITEM_NORMAL_STYLE = {...PANELBAR_ITEMBASESTYLE, color: Colors.GRAY4};
const PANEL_BAR_ITEM_SELECTED_STYLE = {
    ...PANELBAR_ITEMBASESTYLE,
    color: Colors.WHITE,
    backgroundColor: Colors.DARK_GRAY5
};


interface IPanelBarProps {
    panels: JSX.Element[];
    selectedTopPanelId: string | null;
    selectedBottomPanelId: string | null;
    onTopPanelSelected: (panelId: string) => void;
    onBottomPanelSelected: (panelId: string) => void;
    barSize: number;
    position: "left" | "right";
}

function PanelBar(props: IPanelBarProps) {
    const position = props.position || "left";
    const tooltipPos = position === "left" ? Position.RIGHT : Position.LEFT;
    const selectedTopPanelId = props.selectedTopPanelId;
    const selectedBottomPanelId = props.selectedBottomPanelId;
    const barSize = props.barSize;
    const panels = props.panels || [];
    const topPanelButtons: JSX.Element[] = [];
    const bottomPanelButtons: JSX.Element[] = [];

    function renderPanelButton(panel, selectedPanelId: string) {
        const panelId: string = panel.props.id;
        const panelTitle: string = panel.props.title;
        const panelIconName: string = panel.props.iconName;
        const selected = panelId === selectedPanelId;
        return (
            <li key={panelId}
                onClick={() => props.onTopPanelSelected(panelId)}
                style={selected ? PANEL_BAR_ITEM_SELECTED_STYLE : PANEL_BAR_ITEM_NORMAL_STYLE}>
                <Tooltip content={panelTitle} position={tooltipPos} hoverOpenDelay={1500}>
                <span className={"pt-icon-large " + panelIconName}
                      style={{textAlign: "center", verticalAlign: "middle"}}/>
                </Tooltip>
            </li>
        );
    }

    for (let panel of panels) {
        if (!panel.props || !panel.props.id) {
            console.error('PanelBar children must be of type Panel');
            continue;
        }
        const panelPosition: string = panel.props.position || "top";
        if (panelPosition === "top")  {
            topPanelButtons.push(renderPanelButton(panel, props.selectedTopPanelId));
        } else {
            bottomPanelButtons.push(renderPanelButton(panel, props.selectedBottomPanelId));
        }
    }

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                flex: "none",
                maxHeight: "100%",
                minWidth: barSize,
                overflow: "hidden",
                backgroundColor: Colors.DARK_GRAY2
            }}>
            <ul style={{flex: "none", listStyleType: "none", padding: 0, margin: 0, border: "none"}}>
                {topPanelButtons}
            </ul>
            <div style={{flex: "auto"}}/>
            <ul style={{flex: "none", listStyleType: "none", padding: 0, margin: 0, border: "none"}}>
                {bottomPanelButtons}
            </ul>
        </div>
    );
}

interface IPanelPaneProps {
    panel: JSX.Element | null;
    onClose: (panelId: string) => void;
    onSizeChange: (delta: number) => void;
    position: "left" | "right";
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

    const bodyContainerStyle = {
        overflow: "auto",
        //width: "100%",
        flexGrow: 1,
        padding: 2
    };

    let panelParent = (
        <div style={panelParentStyle}>
            <PanelHeader
                id={panelId}
                title={panel.props.title}
                iconName={panel.props.iconName}
                onClose={() => props.onClose(panelId)}
            />
            <div style={bodyContainerStyle}>
                {panelBody}
            </div>
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
