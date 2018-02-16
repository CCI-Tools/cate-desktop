import * as React from "react";
import {connect, DispatchProp} from "react-redux";
import {Button, Label, Radio, RadioGroup} from "@blueprintjs/core";
import * as actions from "../actions";
import {CONDA_MODE_EXISTING, CONDA_MODE_NEW, CondaMode, State} from "../state";

interface ICondaInstallScreenProps {
    condaMode: CondaMode;
    targetDir: string;
    pythonExe: string;
}

function mapStateToProps(state: State): ICondaInstallScreenProps {
    return {
        condaMode: state.condaMode,
        pythonExe: state.pythonExe,
        targetDir: state.targetDir,
    };
}

class _CondaInstallScreen extends React.PureComponent<ICondaInstallScreenProps & DispatchProp<ICondaInstallScreenProps>> {

    render() {
        let details;

        if (this.props.condaMode === CONDA_MODE_NEW) {
            details = (
                <Label text="Select the Anaconda or Miniconda Python executable:">
                    <div className="pt-control-group">
                        <div className="pt-input-group pt-fill">
                            <input type="text"
                                   className="pt-input"
                                   placeholder="Executable file"
                                   value={this.props.pythonExe}
                                   onChange={(event) => this.props.dispatch(actions.setPythonExe(event.target.value))}/>
                        </div>
                        <Button text="Browse..."
                                onClick={() => this.props.dispatch(actions.browsePythonExe())}/>
                    </div>
                </Label>
            );
        } else {
            details = (
                <Label text="Select a target directory for the new Miniconda installation:">
                    <div className="pt-control-group">
                        <div className="pt-input-group pt-fill">
                            <input type="text"
                                   className="pt-input"
                                   placeholder="Target directory"
                                   value={this.props.targetDir}
                                   onChange={(event) => this.props.dispatch(actions.setTargetDir(event.target.value))}/>
                        </div>
                        <Button text="Browse..."
                                onClick={() => this.props.dispatch(actions.browseTargetDir())}/>
                    </div>
                </Label>
            );
        }

        return (
            <div>

                <p>Cate requires a dedicated Python environment. Currently, Cate can only run with
                   the <a href="https://www.anaconda.com/download/" target="_blank">Anaconda</a>
                    or <a href="https://conda.io/miniconda.html" target="_blank">Miniconda</a> distributions of Python.
                </p>

                <p>Please select an option:</p>

                <div style={{marginLeft: 32}}>
                    <RadioGroup
                        onChange={(event: any) => this.props.dispatch(actions.setCondaMode(event.target.value))}
                        selectedValue={this.props.condaMode}>
                        <Radio label="Install a new Miniconda"
                               value={CONDA_MODE_NEW}/>
                        <Radio label="Use an existing Anaconda or Miniconda installation"
                               value={CONDA_MODE_EXISTING}/>
                    </RadioGroup>
                </div>

                <div style={{marginLeft: 32, marginTop: 32}}>
                    {details}
                </div>

            </div>
        );
    }
}

export const CondaInstallScreen = connect(mapStateToProps)(_CondaInstallScreen);
