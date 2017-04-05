import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {State, WorldViewMode} from "../state";
import {RadioGroup, Radio, Button, NonIdealState} from "@blueprintjs/core";
import {ProjectionField} from "../components/field/ProjectionField";
import {FieldValue} from "../components/field/Field";
import * as selectors from "../selectors";
import * as actions from "../actions";
import {ViewState} from "../components/ViewState";
import {Card} from "../components/Card";

interface IViewPanelDispatch {
    dispatch: Dispatch<State>;
}

interface IViewPanelProps {
    activeView: ViewState<any>;
}

interface IViewPanelState {
    isProjectionsDialogOpen: boolean;
}

function mapStateToProps(state: State): IViewPanelProps {
    return {
        activeView: selectors.activeViewSelector(state),
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
        this.props.dispatch(actions.setViewMode(ev.target.value));
    }

    onProjectionCodeChange(projectionCode: FieldValue<string>) {
        this.props.dispatch(actions.setProjectionCode(projectionCode.textValue));
    }

    onAddWorldView() {
        this.props.dispatch(actions.addWorldView());
    }

    render() {
        return (
            <div>
                <Button iconName="globe" onClick={this.onAddWorldView}>Add World View</Button>
                {this.renderActiveViewPanel()}
            </div>
        );
    }

    renderActiveViewPanel() {

        const activeView = this.props.activeView;
        if (!activeView) {
            return <NonIdealState visual="eye" title="No active view" description="Create a view first."/>;
        }

        if (activeView.type === 'world') {
            return (
                <div>
                    <RadioGroup
                        label="View mode"
                        onChange={this.onViewModeChange}
                        selectedValue={this.props.viewMode}>
                        <Radio label="3D Globe" value="3D"/>
                        <Radio label="2D Map" value="2D"/>
                    </RadioGroup>

                    <label className="pt-label">
                        Projection
                        <span className="pt-text-muted"> (for 2D Map)</span>
                        <ProjectionField
                            value={this.props.viewMode === '2D' ? this.props.projectionCode : "3D Perspective"}
                            onChange={this.onProjectionCodeChange}
                            disabled={this.props.viewMode !== '2D'}/>
                    </label>
                </div>
            );
        } else {
            return <NonIdealState visual="eye" title="No view properties" description="The active view is not yet supported."/>;
        }
    }
}

export default connect(mapStateToProps)(ViewPanel);
