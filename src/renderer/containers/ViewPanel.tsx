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

// Drop 2D map view #390
const HAS_WORLD_VIEW_2D = false;

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
    isSelectedLayerSplit: boolean;
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
        isSelectedLayerSplit: selectors.isSelectedLayerSplitSelector(state),
    };
}

/**
 * The LayersPanel is used to select and browse available layers.
 *
 * @author Norman Fomferra
 */
class ViewPanel extends React.Component<IViewPanelProps & IViewPanelDispatch, IViewPanelState> {

    private static ACTION_ITEM_STYLE = {margin: "0.1em 0em 2em 0em"};
    private static PROPERTY_ITEM_STYLE = {margin: "0.1em 0em 0.6em 0em"};
    private static CREDITS_LABEL_STYLE = {margin: "2em 0em 0.6em 0em"};
    private static CREDITS_CONTAINER_STYLE: any = {
        width: "100%",
        minHeight: "6em",
        position: "relative",
        padding: "0.2em 0.2em 0.2em 0.2em",
        margin: "0.2em 0 0.2em 0",
        backgroundColor: 'rgba(255,255,255,0.1)'
    };

    constructor(props: IViewPanelProps & IViewPanelDispatch) {
        super(props);
        this.onViewModeChange = this.onViewModeChange.bind(this);
        this.onProjectionCodeChange = this.onProjectionCodeChange.bind(this);
        this.onAddWorldView = this.onAddWorldView.bind(this);
        this.onShowLayerTextOverlayChange = this.onShowLayerTextOverlayChange.bind(this);
        this.onSplitSelectedVariableLayer = this.onSplitSelectedVariableLayer.bind(this);
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

    onSplitSelectedVariableLayer(ev) {
        const isSelectedLayerSplit = ev.target.checked;
        this.props.dispatch(actions.setSelectedLayerSplit(this.props.activeViewId, isSelectedLayerSplit));
    }

    onAddWorldView() {
        this.props.dispatch(actions.addWorldView(this.props.activeViewId));
    }

    render() {
        return (
            <div style={{margin: "0.2em 0.2em 0.2em 0.2em"}}>
                <AnchorButton iconName="globe"
                              style={ViewPanel.ACTION_ITEM_STYLE}
                              onClick={this.onAddWorldView}>New World View</AnchorButton>
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
            <label className="pt-label" style={ViewPanel.PROPERTY_ITEM_STYLE}>
                Active view:
                <div className="pt-input-group">
                    <span className={"pt-icon " + activeView.iconName}/>
                    <input className="pt-input" type="text" value={activeView.title} dir="auto" disabled={true}/>
                </div>
            </label>
        );

        if (activeView.type === 'world') {

            let globeMapSwitch;
            let projectionField;

            if (HAS_WORLD_VIEW_2D) {
                const worldView = activeView as ViewState<WorldViewDataState>;

                // Drop 2D map view #390
                const is3DGlobe = worldView.data.viewMode === '3D';

                // Drop 2D map view #390
                const globeMapSwitch = (
                    <div style={ViewPanel.PROPERTY_ITEM_STYLE}>
                        <RadioGroup
                            label="View mode"
                            onChange={this.onViewModeChange}
                            selectedValue={worldView.data.viewMode}>
                            <Radio label="3D Globe" value="3D"/>
                            <Radio label="2D Map" value="2D"/>
                        </RadioGroup>
                    </div>
                );

                // Drop 2D map view #390
                const projectionField = (
                    <label className="pt-label" style={ViewPanel.PROPERTY_ITEM_STYLE}>
                        Projection
                        {is3DGlobe ? <span className="pt-text-muted"> (for 2D Map only)</span> : null}
                        <ProjectionField
                            disabled={is3DGlobe}
                            value={worldView.data.projectionCode}
                            onChange={this.onProjectionCodeChange}
                        />
                    </label>
                );
            }

            return (
                <div>
                    {titleField}
                    {globeMapSwitch}
                    {projectionField}

                    <Checkbox label="Show layer text overlay"
                              style={ViewPanel.PROPERTY_ITEM_STYLE}
                              checked={this.props.showLayerTextOverlay}
                              onChange={this.onShowLayerTextOverlayChange}/>

                    <Checkbox label="Split selected image layer"
                              style={ViewPanel.PROPERTY_ITEM_STYLE}
                              checked={this.props.isSelectedLayerSplit}
                              onChange={this.onSplitSelectedVariableLayer}/>

                    <label className="pt-label" style={ViewPanel.CREDITS_LABEL_STYLE}>
                        Imagery layer credits:
                        <div id="creditContainer"
                             style={ViewPanel.CREDITS_CONTAINER_STYLE}/>
                    </label>
                </div>
            );
        } else {
            return titleField;
        }
    }
}

export default connect(mapStateToProps)(ViewPanel);
