import * as React from 'react';
import {State, WorkspaceState, ChartViewDataState} from "../state";
import {connect} from "react-redux";
import {ViewState} from "../components/ViewState";
import {PlotlyPanel} from "../components/plotly/PlotlyPanel";

interface IChartViewOwnProps {
    view: ViewState<ChartViewDataState>;
}

interface IChartViewProps extends IChartViewOwnProps {
    baseUrl: string;
    workspace: WorkspaceState | null;
}

function mapStateToProps(state: State, ownProps: IChartViewOwnProps): IChartViewProps {
    return {
        view: ownProps.view,
        baseUrl: state.data.appConfig.webAPIConfig.restUrl,
        workspace: state.data.workspace,
    };
}

/**
 * This component displays a 2D map with a number of layers.
 */
class ChartView extends React.Component<IChartViewProps, null> {

    render() {
        return (
            <PlotlyPanel id={'PlotlyPanel-' + this.props.view.id}
                         debug={true}
                         charts={this.props.view.data.charts}
                         style={{width: "100%", height: "100%"}}/>
        );
    }
}

export default connect(mapStateToProps)(ChartView);


