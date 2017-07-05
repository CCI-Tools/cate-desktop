import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {FigureViewDataState, ResourceState, State, WorldViewDataState} from "../state";
import {RadioGroup, Radio, AnchorButton, Checkbox} from "@blueprintjs/core";
import {ProjectionField} from "../components/field/ProjectionField";
import {FieldValue} from "../components/field/Field";
import * as selectors from "../selectors";
import * as actions from "../actions";
import {ViewState} from "../components/ViewState";
import {Card} from "../components/Card";
import {NO_ACTIVE_VIEW} from "../messages";

interface IViewPanelDispatch {
    dispatch: Dispatch<State>;
}

interface IViewPanelProps {
    activeView: ViewState<any> | null;
    activeViewId: string | null;
    figureViews: ViewState<FigureViewDataState>[];
    figureResources: ResourceState[];
    selectedFigureResource: ResourceState | null;
    selectedResourceName: string | null;
    showLayerTextOverlay: boolean;
}

interface IViewPanelState {
    isProjectionsDialogOpen: boolean;
}

function mapStateToProps(state: State): IViewPanelProps {
    return {
        activeView: selectors.activeViewSelector(state),
        activeViewId: selectors.activeViewIdSelector(state),
        figureViews: selectors.figureViewsSelector(state),
        figureResources: selectors.figureResourcesSelector(state),
        selectedFigureResource: selectors.selectedFigureResourceSelector(state),
        selectedResourceName: selectors.selectedResourceNameSelector(state),
        showLayerTextOverlay: state.session.showLayerTextOverlay,
    };
}

/**
 * The LayersPanel is used to select and browse available layers.
 *
 * @author Norman Fomferra
 */
class ViewPanel extends React.Component<IViewPanelProps & IViewPanelDispatch, IViewPanelState> {

    private static ITEM_STYLE = {margin: "0.1em 0.2em 0.1em 0.2em"};

    constructor(props: IViewPanelProps & IViewPanelDispatch) {
        super(props);
        this.onViewModeChange = this.onViewModeChange.bind(this);
        this.onProjectionCodeChange = this.onProjectionCodeChange.bind(this);
        this.onAddWorldView = this.onAddWorldView.bind(this);
        this.onShowLayerTextOverlayChange = this.onShowLayerTextOverlayChange.bind(this);
        this.state = {isProjectionsDialogOpen: false};
    }

    onViewModeChange(ev: any) {
        this.props.dispatch(actions.setViewMode(this.props.activeViewId, ev.target.value));
    }

    onProjectionCodeChange(projectionCode: FieldValue<string>) {
        this.props.dispatch(actions.setProjectionCode(this.props.activeViewId, projectionCode.textValue));
    }

    onShowLayerTextOverlayChange(ev) {
        const showLayerTextOverlay = ev.target.checked;
        this.props.dispatch(actions.updateSessionState({showLayerTextOverlay}));
    }

    onAddWorldView() {
        this.props.dispatch(actions.addWorldView(this.props.activeViewId));
    }

    render() {
        return (
            <div style={ViewPanel.ITEM_STYLE}>
                <AnchorButton style={{marginBottom: 4}} iconName="globe" onClick={this.onAddWorldView}>New World
                    View</AnchorButton>
                {this.renderActiveViewPanel()}
            </div>
        );
    }

    renderActiveViewPanel() {

        const activeView = this.props.activeView;
        if (!activeView) {
            return NO_ACTIVE_VIEW;
        }

        // TODO (forman): make title field editable
        const titleField = (
            <label className="pt-label" style={ViewPanel.ITEM_STYLE}>
                View title
                <div className="pt-input-group">
                    <span className={"pt-icon " + activeView.iconName}/>
                    <input className="pt-input" type="text" value={activeView.title} dir="auto" disabled={true}/>
                </div>
            </label>
        );

        if (activeView.type === 'world') {
            const worldView = activeView as ViewState<WorldViewDataState>;
            let is3DGlobe = worldView.data.viewMode === '3D';
            return (
                <div>
                    {titleField}

                    <div style={ViewPanel.ITEM_STYLE}>
                        <RadioGroup
                            label="View mode"
                            onChange={this.onViewModeChange}
                            selectedValue={worldView.data.viewMode}>
                            <Radio label="3D Globe" value="3D"/>
                            <Radio label="2D Map" value="2D"/>
                        </RadioGroup>
                    </div>

                    <label className="pt-label" style={ViewPanel.ITEM_STYLE}>
                        Projection
                        {is3DGlobe ? <span className="pt-text-muted"> (for 2D Map only)</span> : null}
                        <ProjectionField
                            disabled={is3DGlobe}
                            value={worldView.data.projectionCode}
                            onChange={this.onProjectionCodeChange}
                        />
                    </label>

                    <Checkbox label="Show layer text overlay"
                              style={ViewPanel.ITEM_STYLE}
                              checked={this.props.showLayerTextOverlay}
                              onChange={this.onShowLayerTextOverlayChange}/>

                    <label className="pt-label" style={ViewPanel.ITEM_STYLE}>
                        Imagery layer credits
                        <Card>
                            <div id="creditContainer"
                                 style={{minWidth: "10em", minHeight: "4em", position: "relative", overflow: "auto"}}/>
                        </Card>
                    </label>
                </div>
            );
        } else {
            return titleField;
        }
    }
}

export default connect(mapStateToProps)(ViewPanel);
