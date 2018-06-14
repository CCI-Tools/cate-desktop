import * as React from 'react';
import {connect, Dispatch} from 'react-redux';
import {State} from "../state";
import {AnchorButton, Checkbox} from "@blueprintjs/core";
import * as selectors from "../selectors";
import * as actions from "../actions";
import {ViewState} from "../components/ViewState";
import {NO_ACTIVE_VIEW} from "../messages";

interface IViewPanelDispatch {
    dispatch: Dispatch<State>;
}

interface IViewPanelProps {
    activeView: ViewState<any> | null;
    activeViewId: string | null;
    showLayerTextOverlay: boolean;
}

function mapStateToProps(state: State): IViewPanelProps {
    return {
        activeView: selectors.activeViewSelector(state),
        activeViewId: selectors.activeViewIdSelector(state),
        showLayerTextOverlay: state.session.showLayerTextOverlay,
    };
}

/**
 * The LayersPanel is used to select and browse available layers.
 *
 * @author Norman Fomferra
 */
class ViewPanel extends React.Component<IViewPanelProps & IViewPanelDispatch, null> {

    private static ACTION_ITEM_STYLE = {margin: "0.1em 0em 2em 0em"};
    private static PROPERTY_ITEM_STYLE = {margin: "0.1em 0em 0.6em 0em"};

    constructor(props: IViewPanelProps & IViewPanelDispatch) {
        super(props);
        this.onViewModeChange = this.onViewModeChange.bind(this);
        this.onAddWorldView = this.onAddWorldView.bind(this);
        this.onShowLayerTextOverlayChange = this.onShowLayerTextOverlayChange.bind(this);
    }

    onViewModeChange(ev: any) {
        this.props.dispatch(actions.setViewMode(this.props.activeViewId, ev.target.value));
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

            return (
                <div>
                    {titleField}

                    <Checkbox label="Show layer text overlay"
                              style={ViewPanel.PROPERTY_ITEM_STYLE}
                              checked={this.props.showLayerTextOverlay}
                              onChange={this.onShowLayerTextOverlayChange}/>
                </div>
            );
        } else {
            return titleField;
        }
    }
}

export default connect(mapStateToProps)(ViewPanel);
