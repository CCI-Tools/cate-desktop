import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {FigureViewDataState, ResourceState, State, WorldViewDataState} from "../state";
import {RadioGroup, Radio, AnchorButton} from "@blueprintjs/core";
import {ProjectionField} from "../components/field/ProjectionField";
import {FieldValue} from "../components/field/Field";
import * as selectors from "../selectors";
import * as actions from "../actions";
import {ViewState} from "../components/ViewState";
import {Card} from "../components/Card";
import {NO_ACTIVE_VIEW, NO_VIEW_PROPS} from "../messages";

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
    };
}

/**
 * The LayersPanel is used to select and browse available layers.
 *
 * @author Norman Fomferra
 */
class ViewPanel extends React.Component<IViewPanelProps & IViewPanelDispatch, IViewPanelState> {

    constructor(props: IViewPanelProps & IViewPanelDispatch, context: any) {
        super(props, context);
        this.onViewModeChange = this.onViewModeChange.bind(this);
        this.onProjectionCodeChange = this.onProjectionCodeChange.bind(this);
        this.onAddWorldView = this.onAddWorldView.bind(this);
        this.state = {isProjectionsDialogOpen: false};
    }

    onViewModeChange(ev: any) {
        this.props.dispatch(actions.setViewMode(this.props.activeViewId, ev.target.value));
    }

    onProjectionCodeChange(projectionCode: FieldValue<string>) {
        this.props.dispatch(actions.setProjectionCode(this.props.activeViewId, projectionCode.textValue));
    }

    onAddWorldView() {
        this.props.dispatch(actions.addWorldView(this.props.activeViewId));
    }

    render() {
        return (
            <div>
                <div className="pt-button-group">
                    <AnchorButton iconName="globe" onClick={this.onAddWorldView}>Add World View</AnchorButton>
                </div>
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
            <label className="pt-label">
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

                    <RadioGroup
                        label="View mode"
                        onChange={this.onViewModeChange}
                        selectedValue={worldView.data.viewMode}>
                        <Radio label="3D Globe" value="3D"/>
                        <Radio label="2D Map" value="2D"/>
                    </RadioGroup>

                    <label className="pt-label">
                        Projection
                        {is3DGlobe ? <span className="pt-text-muted"> (for 2D Map only)</span> : null}
                        <ProjectionField
                            disabled={is3DGlobe}
                            value={worldView.data.projectionCode}
                            onChange={this.onProjectionCodeChange}
                        />
                    </label>

                    <label className="pt-label">
                        Imagery layer credits
                        <Card>
                            <div id="creditContainer"
                                 style={{minWidth: "10em", minHeight: "4em", position: "relative", overflow: "auto"}}/>
                        </Card>
                    </label>
                </div>
            );
        } else {
            return (
                <div>
                    {titleField}
                    {NO_VIEW_PROPS}
                </div>
            );
        }
    }
}

export default connect(mapStateToProps)(ViewPanel);
