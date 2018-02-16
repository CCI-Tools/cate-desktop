import * as React from "react";
import {connect, DispatchProp} from "react-redux";
import {Checkbox, Radio, RadioGroup} from "@blueprintjs/core";
import * as actions from "../actions";
import {SETUP_MODE_AUTO, SETUP_MODE_USER, SetupMode, State} from "../state";
import {FormEvent} from "react";

interface IStartScreenProps {
    setupReason: string;
    setupMode: SetupMode;
    silentMode: boolean;
}

function mapStateToProps(state: State): IStartScreenProps {
    return {
        setupReason: state.setupReason,
        setupMode: state.setupMode,
        silentMode: state.silentMode,
    };
}

class _StartScreen extends React.PureComponent<IStartScreenProps & DispatchProp<IStartScreenProps>> {

    render() {

        let silentModePanel;
        if (this.props.setupMode === SETUP_MODE_AUTO) {
            silentModePanel = (
                <div style={{marginTop: 32, marginLeft: 32}}>
                    <Checkbox label="Remember my decision and don't ask again"
                              checked={this.props.silentMode}
                    onChange={(event: any) => this.props.dispatch(actions.setSilentMode(event.target.checked))}/>
                </div>
            );
        }

        return (
            <div>

                <p>Cate Desktop requires some additional setup before it can be started.</p>

                <p className="pt-text-muted">This screen occurs only when Cate requires
                    additional setup. The reason
                    for the current setup is: {this.props.setupReason}</p>

                <p>Please select an option:</p>

                <div style={{marginLeft: 32}}>
                    <RadioGroup
                        onChange={(event: any) => this.props.dispatch(actions.setSetupMode(event.target.value))}
                        selectedValue={this.props.setupMode}>
                        <Radio label="Automatic setup (appropriate for most users)" value={SETUP_MODE_AUTO}/>
                        <Radio label="User-defined setup" value={SETUP_MODE_USER}/>
                    </RadioGroup>
                </div>

                {silentModePanel}

            </div>
        );
    }
}

export const StartScreen = connect(mapStateToProps)(_StartScreen);
