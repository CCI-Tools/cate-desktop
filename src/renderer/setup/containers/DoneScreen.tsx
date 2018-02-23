import * as React from "react";
import {connect} from "react-redux";
import {Checkbox} from "@blueprintjs/core";
import {SETUP_STATUS_SUCCEEDED, SetupStatus, State} from "../state";
import * as actions from "../actions";
import {SetupScreen} from "../components/SetupScreen";

interface IDoneScreenProps {
    setupStatus: SetupStatus;
    autoUpdateCate: boolean;
}

function mapStateToProps(state: State): IDoneScreenProps {
    return {
        setupStatus: state.setupStatus,
        autoUpdateCate: state.autoUpdateCate,
    };
}

class _DoneScreen extends React.PureComponent<IDoneScreenProps & actions.DispatchProp> {
    render() {
        const panel = (
            <div>
                <p>Cate Desktop is now ready to be used. Thanks for your patience!</p>

                <p style={{marginTop: 32}}>Setup can check and update the <code>cate</code> Python package automatically
                    before every start of Cate Desktop.</p>

                <div style={{marginLeft: 32}}>
                    <Checkbox label="Automatically update Cate Python package"
                              checked={this.props.autoUpdateCate}
                              onChange={(event: any) => this.props.dispatch(actions.setAutoUpdateCate(event.target.checked))}/>
                </div>

                <p style={{marginTop: 64}}>Click <strong>Done</strong> to end setup and start Cate Desktop.</p>
            </div>
        );

        return <SetupScreen
            title="Run Setup Tasks"
            panel={panel}
            noNextButton={this.props.setupStatus !== SETUP_STATUS_SUCCEEDED}
            nextButtonLabel={"End"}
            nextButtonIcon={"tick-circle"}
            onNextButtonClick={() => this.props.dispatch(actions.endSetup())}
            onCancelClick={() => this.props.dispatch(actions.cancelSetup())}
        />;
    }
}

export const DoneScreen = connect(mapStateToProps)(_DoneScreen);
