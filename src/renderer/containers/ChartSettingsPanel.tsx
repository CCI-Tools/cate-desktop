import * as React from "react";
import {connect} from "react-redux";
import {State} from "../state";
import {NO_CHARTS} from "../messages";

interface IDispatch {
    dispatch: (action: any) => void;
}

interface IPlotSettingsPanelProps {
}


function mapStateToProps(state: State): IPlotSettingsPanelProps {
    return {};
}

/**
 * The ChartSettingsPanel is used to select individual plots/charts
 * and lets users change its data source settings (e.g. variable index)
 * and style.
 *
 * @author Norman Fomferra
 */
class ChartSettingsPanel extends React.Component<IPlotSettingsPanelProps | IDispatch, null> {
    constructor(props: IPlotSettingsPanelProps) {
        super(props);
    }

    render() {
        return NO_CHARTS;
    }
}
export default connect(mapStateToProps)(ChartSettingsPanel);
