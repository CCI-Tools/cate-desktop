import * as React from "react";
import {connect} from "react-redux";
import {State} from "../state";

interface IStatusBarProps {
    webAPIStatus: 'connecting'|'open'|'error'|'closed'|null;
}

function mapStateToProps(state: State): IStatusBarProps {
    return {
        webAPIStatus: state.communication.webAPIStatus
    };
}

/**
 * The TasksPanel is used display all tasks originating from cate desktop,
 * this includes progress and error messages.
 *
 * @author Marco Zuehlke
 */
class StatusBar extends React.Component<IStatusBarProps, null> {
    constructor(props: IStatusBarProps) {
        super(props);
    }

    render() {
        // TODO dummy
        const message = "MESSAGE";

        // TODO dummy
        const lat = 42.78;
        const lon = 22.76;
        const cursor = `LAT = ${lat.toFixed(2)} LON = ${lon.toFixed(2)}`;

        // TODO dummy
        const tasks = "processing...";

        // TODO should be replaced with an icon
        const backend = this.props.webAPIStatus;
        return (
            <div
                style={{display:"flex", flexFlow: "row nowrap", height: "1.5em", fontSize: "small", backgroundColor: "#2B95D6"}}>
                <div style={{flex: "1 0 auto", padding: "1px 1px 1px 1px", border: "1px solid white" }}>{message}</div>
                <div style={{flex: "0 0 auto", padding: "1px 1px 1px 1px", border: "1px solid white" }}>{cursor}</div>
                <div style={{flex: "1 0 auto", padding: "1px 1px 1px 1px", border: "1px solid white" }}>{tasks}</div>
                <div style={{flex: "0 0 auto", padding: "1px 1px 1px 1px", border: "1px solid white" }}>{backend}</div>
            </div>
        );
    }
}
export default connect(mapStateToProps)(StatusBar);
