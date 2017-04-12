import * as React from 'react';
import {State, WorkspaceState, ChartViewDataState} from "../state";
import {connect} from "react-redux";
import {ViewState} from "../components/ViewState";
import {PlotPanel} from "../components/plotly/PlotlyPanel";

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
        const plots = [];
        let view = this.props.view;
        for (let i in view.data.charts) {
            let chart = view.data.charts[i];
            let id = `plot-${chart.id}-${view.id}`;
            plots.push(
                <PlotPanel
                    key={id}
                    id={id}
                    type="line"
                    debug={true}
                    title="bibo"
                    style={{width: "100%", height: "100%"}}
                    data={null}
                    layout={null}/>
            );
        }
        return <div>{plots}</div>
    }
}

export default connect(mapStateToProps)(ChartView);


