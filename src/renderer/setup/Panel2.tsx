import * as React from "react";
import * as actions from "./actions";
import {connect, DispatchProp} from "react-redux";
import {State} from "./state";
import {Button, Label, Radio, RadioGroup} from "@blueprintjs/core";

interface IPanel2Props {
    mode: "new" | "existing";
    targetDir: string;
    pythonExe: string;
}

function mapStateToProps(state: State): IPanel2Props {
    return {
        mode: state.mode,
        pythonExe: state.pythonExe,
        targetDir: state.targetDir,
    };
}

class _Panel2 extends React.PureComponent<IPanel2Props & DispatchProp<IPanel2Props>> {
    render() {

        if (this.props.mode === "existing") {
            return (
                <Label text="Select the Anaconda or Miniconda Python executable:"
                       required={true}
                       style={{marginLeft: 32}}>
                    <div className="pt-control-group">
                        <div className="pt-input-group pt-fill">
                            <input type="text"
                                   className="pt-input"
                                   placeholder="Executable file"
                                   value={this.props.pythonExe}
                                   onChange={(event) => this.props.dispatch(actions.pythonExe(event.target.value))}/>
                        </div>
                        <Button>Browse...</Button>
                    </div>
                </Label>
            );
        } else {
            return (
                <Label text="Select a target directory for the new Miniconda installation:"
                       required={true}
                       style={{marginLeft: 32}}>
                    <div className="pt-control-group">
                        <div className="pt-input-group pt-fill">
                            <input type="text"
                                   className="pt-input"
                                   placeholder="Target directory"
                                   value={this.props.targetDir}
                            onChange={(event) => this.props.dispatch(actions.targetDir(event.target.value))}/>
                        </div>
                        <Button>Browse...</Button>
                    </div>
                </Label>
            );
        }

    }
}

export const Panel2 = connect(mapStateToProps)(_Panel2);
