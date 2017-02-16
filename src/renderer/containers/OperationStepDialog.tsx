import * as React from 'react';
import {connect} from "react-redux";
import {Dialog, Classes, Button, Tooltip, Checkbox} from "@blueprintjs/core";
import {OperationState, WorkspaceState, OperationInputState, State, DialogState} from "../state";
import FormEvent = React.FormEvent;
import {InputEditor} from "../components/InputEditor";
import {FloatField} from "../components/FloatField";
import {IntField} from "../components/IntField";
import {TextField} from "../components/TextField";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {updatePropertyObject} from "../../common/objutil";


export interface IInputAssignment {
    constantValue: any;
    resourceName: string;
    isValueUsed: boolean;
}

type InputAssignmentMap = {[inputName: string]: IInputAssignment};

type EditorCallback = (input: OperationInputState, value: any) => any;
type FailureCallback = (textValue: string, error: any) => any;
type ShowFileCallback = (input: OperationInputState,
                         value: string|null,
                         onChange: EditorCallback) => any;

interface IOperationStepDialogOwnProps {
    isAddDialog?: boolean;
}

interface IOperationStepDialogProps extends IOperationStepDialogOwnProps {
    dispatch?: any;
    isOpen: boolean,
    inputAssignments: {[opName: string]: InputAssignmentMap};
    workspace: WorkspaceState;
    operation: OperationState;
    newResourceName: string,
}

function mapStateToProps(state: State, ownProps: IOperationStepDialogOwnProps): IOperationStepDialogProps {
    const dialogStateSelector = selectors.dialogStateSelector(OperationStepDialog.DIALOG_ID);
    const dialogState = dialogStateSelector(state);
    return {
        isAddDialog: ownProps.isAddDialog,
        isOpen: dialogState.isOpen,
        inputAssignments: (dialogState as any).inputAssignments,
        workspace: selectors.workspaceSelector(state),
        operation: selectors.selectedOperationSelector(state),
        newResourceName: selectors.newResourceNameSelector(state),
    };
}

class OperationStepDialog extends React.Component<IOperationStepDialogProps, InputAssignmentMap> {
    static readonly DIALOG_ID = 'operationStepDialog';

    constructor(props: IOperationStepDialogProps) {
        super(props);
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleValidate = this.handleValidate.bind(this);
        this.handleDefaults = this.handleDefaults.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
        this.state = propsToState(props);
    }

    componentWillReceiveProps(nextProps: IOperationStepDialogProps) {
        this.setState(propsToState(nextProps));
    }

    private handleConfirm() {
        const operation = this.props.operation;
        const resName = this.props.newResourceName;
        const opName = operation.name;
        const opArgs = {};
        operation.inputs.forEach((input) => {
            const inputAssignment = this.state[input.name];
            let opArg;
            if (inputAssignment.isValueUsed) {
                opArg = {value: inputAssignment.constantValue};
            } else {
                opArg = {source: inputAssignment.resourceName};
            }
            opArgs[input.name] = opArg;
        });
        console.log(`OperationStepDialog: handleConfirm: op="${opName}", args=${opArgs}`);
        this.props.dispatch(actions.hideOperationStepDialog({[opName]: this.state}));
        this.props.dispatch(actions.setWorkspaceResource(resName, opName, opArgs, `Applying operation "${opName}"`));
    }

    private handleCancel() {
        this.props.dispatch(actions.hideOperationStepDialog());
    }

    //noinspection JSMethodCanBeStatic
    private handleValidate() {
        // TODO (forman): add validation of input values
        console.log('OperationStepDialog: validating inputs (TODO!)');
    }

    private handleDefaults() {
        const inputAssignments = getInputAssignments(this.props.operation, this.props.inputAssignments, true);
        this.setState(Object.assign({}, this.state, inputAssignments));
    }

    private requiresDatasetResources() {
        return this.props.operation.inputs.some(input => {
            return !isValidDefaultValue(input.defaultValue) && isDatasetDataType(input.dataType)
        });
    }

    private hasDatasetResources() {
        return this.props.workspace.resources.some(resource => isDatasetDataType(resource.dataType));
    }

    render() {
        if (!this.props.isOpen) {
            return null;
        }

        const dialogTitle = this.props.isAddDialog ? "Add Operation Step" : "Change Operation Step";
        const tooltipText = this.props.isAddDialog ? 'Add a new operation step to the workflow' : 'Change the operation step parameters.';

        const operation = this.props.operation;
        const bodyHeaderText = (
            <p style={{marginBottom: '1em'}}>
                Adjustable parameter(s) for operation <code>{operation.name}</code>:
            </p>
        );

        let validationFailed = false;
        let bodyFooterText;
        if (this.requiresDatasetResources() && !this.hasDatasetResources()) {
            validationFailed = true;
            bodyFooterText = (
                <p style={{marginTop: '1em'}}>
                    <span style={{color: '#A82A2A', fontWeight: 'bold'}}>Please note:</span> This operation has
                    parameter(s) of type <code>Dataset</code>, but there are no dataset resources available yet.
                    You may consider opening a data source or use the <code>read_netcdf</code> or
                    <code>read_shapefile</code> operations.
                </p>);
        } else {
            bodyFooterText = (
                <p style={{marginTop: '1em'}}>
                    Pressing <span className="pt-icon-play"/> will add operation <code>{operation.name}</code> as a new
                    workflow step to the current workspace. You can remove the step or change it's parameters later.
                </p>);
        }

        const parameterPanel = this.renderParameterPanel();

        return (
            <Dialog
                isOpen={this.props.isOpen}
                iconName="function"
                onClose={this.handleCancel}
                title={dialogTitle}
                autoFocus={true}
                canEscapeKeyClose={true}
                canOutsideClickClose={true}
                enforceFocus={true}
            >
                <div className={Classes.DIALOG_BODY}>
                    {bodyHeaderText}
                    {parameterPanel}
                    {bodyFooterText}
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button onClick={this.handleCancel}>Cancel</Button>
                        <Button onClick={this.handleValidate}>Validate</Button>
                        <Button onClick={this.handleDefaults}>Defaults</Button>
                        <Tooltip content={tooltipText} inline>
                            <Button className="pt-intent-primary"
                                    disabled={validationFailed}
                                    onClick={this.handleConfirm}
                                    iconName="play">Apply</Button>
                        </Tooltip>
                    </div>
                </div>
            </Dialog>
        );
    }

    renderParameterPanel(): JSX.Element {
        const operation = this.props.operation;
        if (!operation.inputs || !operation.inputs.length) {
            return null;
        }

        const handleValidationFailure = (textValue: string, error: any) => {
            console.log('OperationStepDialog: handleValidationFailure', textValue, error);
            actions.showMessageBox({title: 'Input Error', message: error + ''}, actions.MESSAGE_BOX_NO_REPLY);
        };

        const changeInputAssignment = (input: OperationInputState, inputAssignment: IInputAssignment) => {
            console.log('OperationStepDialog: changeInputAssignment: newInputAssignments =', inputAssignment);
            const newInputAssignments = updatePropertyObject(this.state, input.name, inputAssignment);
            console.log('OperationStepDialog: changeInputAssignment: newInputAssignments =', newInputAssignments);
            this.setState(newInputAssignments);
        };

        const changeInputResourceName = (input: OperationInputState, resourceName: string, isValueUsed: boolean) => {
            if (resourceName === '' && input.nullable) {
                resourceName = null;
            }
            changeInputAssignment(input, {resourceName, isValueUsed} as IInputAssignment);
        };

        const changeInputConstantValue = (input: OperationInputState, value: any) => {
            if (value === '' && input.nullable) {
                value = null;
            }
            if (value === null && !input.nullable) {
                handleValidationFailure(null, `A value is required for input "${input.name}"`);
                return;
            }
            changeInputAssignment(input, {constantValue: value, isValueUsed: true} as IInputAssignment);
        };

        const changeInputIntValue = (input: OperationInputState, value: number|null) => {
            // TODO (forman): perform validation against input.valueRange, if any
            changeInputConstantValue(input, value);
        };

        const changeInputFloatValue = (input: OperationInputState, value: number|null) => {
            // TODO (forman): perform validation against input.valueRange, if any
            changeInputConstantValue(input, value);
        };

        const inputEditors = operation.inputs.map((input: OperationInputState, index: number) => {
            const inputAssignment = this.state[input.name];
            const constantValue = inputAssignment.constantValue;
            let valueEditor = null;
            switch (input.dataType) {
                case 'int':
                    valueEditor = OperationStepDialog.renderIntInputEditor(input, constantValue, changeInputIntValue, handleValidationFailure);
                    break;
                case 'float':
                    valueEditor = OperationStepDialog.renderFloatInputEditor(input, constantValue, changeInputFloatValue, handleValidationFailure);
                    break;
                case 'bool': {
                    valueEditor = OperationStepDialog.renderBoolInputEditor(input, constantValue, changeInputConstantValue);
                    break;
                }
                case 'str': {
                    // TODO (forman): note the following is a naive decision making, because we don't use input.fileMode yet
                    if (input.name.toLowerCase().endsWith('file')) {
                        let showFileCallback: ShowFileCallback;
                        if (operation.name.toLowerCase().startsWith('read')
                            || operation.name.toLowerCase().startsWith('open')
                            || operation.name.toLowerCase().startsWith('load')) {
                            showFileCallback = OperationStepDialog.showOpenDialog;
                        } else {
                            showFileCallback = OperationStepDialog.showSaveDialog;
                        }
                        valueEditor = OperationStepDialog.renderFileInputEditor(input, constantValue, changeInputConstantValue, showFileCallback);
                    } else {
                        valueEditor = OperationStepDialog.renderStringInputEditor(input, constantValue, changeInputConstantValue, handleValidationFailure);
                    }
                    break;
                }
            }
            return (<InputEditor key={index}
                                 resources={this.props.workspace.resources}
                                 name={input.name}
                                 dataType={input.dataType}
                                 units={input.units}
                                 tooltipText={input.description}
                                 onChange={(resourceName, isValueUsed) => changeInputResourceName(input, resourceName, isValueUsed)}
                                 isValueEditorShown={inputAssignment.isValueUsed}
                                 resourceName={inputAssignment.resourceName}
                                 valueEditor={valueEditor}/>
            );
        });
        return (<div>{inputEditors}</div>);
    }

    private static renderBoolInputEditor(input: OperationInputState,
                                         value: boolean,
                                         onChange: EditorCallback) {
        return (
            <Checkbox checked={value || false}
                      onChange={(event:any) => onChange(input, event.target.checked)}/>
        );
    }

    private static renderIntInputEditor(input: OperationInputState,
                                        value: number|null,
                                        onChange: EditorCallback,
                                        onFailure: FailureCallback) {
        const valueSetEditor = this.renderValueSetEditor(input, value, onChange);
        if (valueSetEditor) {
            return valueSetEditor;
        }
        return (
            <IntField textAlign="right"
                      columns={8}
                      value={value}
                      onChange={(value:number|null) => onChange(input, value)}
                      onFailure={onFailure}
            />
        );
    }

    private static renderFloatInputEditor(input: OperationInputState,
                                          value: number|null,
                                          onChange: EditorCallback,
                                          onFailure: FailureCallback) {
        const valueSetEditor = this.renderValueSetEditor(input, value, onChange);
        if (valueSetEditor) {
            return valueSetEditor;
        }
        return (
            <FloatField textAlign="right"
                        columns={8}
                        value={value}
                        onChange={(value:number|null) => onChange(input, value)}
                        onFailure={onFailure}
            />
        );
    }

    private static renderStringInputEditor(input: OperationInputState,
                                           value: string|null,
                                           onChange: EditorCallback,
                                           onFailure: FailureCallback) {
        const valueSetEditor = this.renderValueSetEditor(input, value, onChange);
        if (valueSetEditor) {
            return valueSetEditor;
        }
        return (
            <TextField columns={10}
                       value={value}
                       onChange={(value:string|null) => onChange(input, value)}
                       onFailure={onFailure}
            />
        );
    }

    private static renderValueSetEditor(input: OperationInputState,
                                        value: string|any,
                                        onChange: EditorCallback) {
        if (input.valueSet && input.valueSet.length) {
            let options = input.valueSet.map((v, i) => (
                <option key={i} value={v}>{v}</option>
            ));
            const NULL_VALUE = '__null__';
            if (input.nullable) {
                options = [<option key={-1} value={NULL_VALUE}/>].concat(...options);
            }
            return (
                <div className="pt-select">
                    <select value={value || NULL_VALUE}
                            onChange={(event:any) => onChange(input, event.target.value === NULL_VALUE ? null : event.target.value)}>
                        {options}
                    </select>
                </div>
            );
        }
        return null;
    }

    private static renderFileInputEditor(input: OperationInputState,
                                         value: string|null,
                                         onChange: EditorCallback,
                                         showFileDialog: ShowFileCallback) {
        return (
            <div className="pt-control-group" style={{width: '20em', display: 'flex'}}>
                <input className="pt-input"
                       type="text"
                       style={{flexGrow: 1}}
                       value={value || ''}
                       placeholder="Enter local file path"
                       onChange={(event:any) => onChange(input, event.target.value)}
                />
                <Button className="pt-intent-primary" style={{flex: 'none'}}
                        onClick={() => showFileDialog(input, value || '', onChange)}>...</Button>
            </div>
        );
    }

    private static showOpenDialog(input: OperationInputState,
                                  value: string|null,
                                  onChange: EditorCallback) {
        const openDialogOptions = {
            title: "Open File",
            defaultPath: value,
            buttonLabel: "Open",
            properties: ["openFile" as actions.OpenDialogProperty],
            filter: input.fileFilters,
        };
        actions.showSingleFileOpenDialog(openDialogOptions, (filePath: string) => {
            if (filePath) {
                onChange(input, filePath);
            }
        });
    }

    private static showSaveDialog(input: OperationInputState,
                                  value: string|null,
                                  onChange: EditorCallback) {
        const saveDialogOptions = {
            title: "Save File",
            defaultPath: value,
            buttonLabel: "Save",
            filter: input.fileFilters,
        };
        actions.showFileSaveDialog(saveDialogOptions, (filePath: string) => {
            if (filePath) {
                onChange(input, filePath);
            }
        });
    }
}

export default connect(mapStateToProps)(OperationStepDialog);


function isDatasetDataType(dataType: string): boolean {
    return dataType && dataType.endsWith('Dataset');
}

function isValidDefaultValue(value: any): boolean {
    return typeof value !== 'undefined';
}

function propsToState(props: IOperationStepDialogProps): InputAssignmentMap {
    const operation = props.operation;
    const inputAssignments = props.inputAssignments;
    return (inputAssignments && inputAssignments[operation.name]) || getInputAssignments(operation);
}

function getInputAssignments(operation: OperationState, lastInputAssignments?, forceDefaults?: boolean) {
    const inputAssignments = {};
    operation.inputs.forEach((input: OperationInputState) => {
        const hasDefaultValue = isValidDefaultValue(input.defaultValue);
        const defaultValue = hasDefaultValue ? input.defaultValue : null;
        const defaultInputAssignment = {constantValue: defaultValue, isValueUsed: true, resourceName: null};
        const lastInputAssignment = lastInputAssignments && lastInputAssignments[input.name];
        let newInputAssignment;
        if (!lastInputAssignment || forceDefaults) {
            newInputAssignment = defaultInputAssignment;
        } else {
            newInputAssignment = lastInputAssignment || defaultInputAssignment;
        }
        inputAssignments[input.name] = newInputAssignment;
    });
    return inputAssignments;
}

