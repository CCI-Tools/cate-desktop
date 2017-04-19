import * as React from "react";
import {connect} from "react-redux";
import {State} from "../state";
import {NO_CHARTS} from "../messages";

interface IDispatch {
    dispatch: (action: any) => void;
}

interface IChartPanelProps {
}


function mapStateToProps(state: State): IChartPanelProps {
    return {};
}

/**
 * The ChartPanel is used to select individual plots/charts
 * and lets users change its data source settings (e.g. variable index)
 * and style.
 *
 * @author Norman Fomferra
 */
class ChartPanel extends React.Component<IChartPanelProps | IDispatch, null> {
    constructor(props: IChartPanelProps) {
        super(props);
    }

    render() {
        return NO_CHARTS;
    }
}

export default connect(mapStateToProps)(ChartSettingsPanel);
