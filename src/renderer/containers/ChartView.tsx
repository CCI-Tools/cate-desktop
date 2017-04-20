import * as React from 'react';
import {State, WorkspaceState, ChartViewDataState} from "../state";
import {connect} from "react-redux";
import {ViewState} from "../components/ViewState";
import {PlotPanel} from "../components/plotly/PlotlyPanel";
import {ScrollablePanelContent} from "../components/ScrollableContent";
import * as selectors from "../selectors";


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
        baseUrl: selectors.webAPIRestUrlSelector(state),
        workspace: selectors.workspaceSelector(state),
    };
}

/**
 * This component displays a 2D map with a number of layers.
 */
class ChartView extends React.Component<IChartViewProps, null> {
    static readonly DIV_STYLE = {width: '100%', minWidth: '100%', maxWidth: '100%', height: '100%', overflowY: 'auto'};

    render() {
        const plots = [];
        let view = this.props.view;
        for (let i in view.data.charts) {
            let chart = view.data.charts[i];
            let id = `ChartView-${chart.id}-${view.id}`;
            plots.push(
                <PlotPanel
                    key={id}
                    id={id}
                    debug={true}
                    title="bibo"
                    type={chart.type}
                    data={chart.data}
                    layout={chart.layout}/>
            );
        }
        return <div style={ChartView.DIV_STYLE}>{plots}</div>
    }
}

export default connect(mapStateToProps)(ChartView);


