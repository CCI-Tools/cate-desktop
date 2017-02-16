import * as React from 'react';
import {Dialog, Classes, Button, Tooltip, Checkbox} from "@blueprintjs/core";
import {DialogState, OperationState, WorkspaceState, OperationInputState} from "../state";
import FormEvent = React.FormEvent;
import {InputEditor} from "../components/InputEditor";
import {FloatField} from "../components/FloatField";
import {IntField} from "../components/IntField";
import {TextField} from "../components/TextField";
import * as actions from "../actions";


export interface InputAssignmentState {
    constantValue: any;
    resourceName: string;
    isValueUsed: boolean;
}

type EditorCallback = (input: OperationInputState, index: number, value: any) => any;
type FailureCallback = (textValue: string, error: any) => any;
type ShowFileCallback = (input: OperationInputState,
                         index: number,
                         value: string|null,
                         onChange: EditorCallback) => any;

export interface IEditOpStepDialogProps {
    onClose: (actionId: string, dialogState: IEditOpStepDialogState) => void;
    workspace: WorkspaceState;
    operation: OperationState;
    isAddOpStepDialog: boolean;
    inputAssignments: Array<InputAssignmentState>;
}

export interface IEditOpStepDialogState extends DialogState {
    inputAssignments: Array<InputAssignmentState>;
}

export class EditOpStepDialog extends React.Component<IEditOpStepDialogProps, IEditOpStepDialogState> {
    private readonly dialogId: string;

    constructor(props: IEditOpStepDialogProps) {
        super(props);
        const inputAssignments = EditOpStepDialog.getInitialInputAssignments(props.operation, props.inputAssignments);
        this.state = {isOpen: true, inputAssignments};
        this.dialogId = EditOpStepDialog.getDialogId(props.operation.name, props.isAddOpStepDialog);
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleValidate = this.handleValidate.bind(this);
        this.handleDefaults = this.handleDefaults.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
    }

    static getDialogId(operationName: string, isAddOpStepDialog: boolean) {
        if (!operationName) {
            return null;
        }
        return (isAddOpStepDialog ? 'addOpStep_' : 'editOpStep_') + operationName;
    }

    private static getInitialInputAssignments(operation: OperationState, parameterValues: Array<InputAssignmentState>) {
        return operation.inputs.map((input, index): InputAssignmentState => {
            const inputAssignment = parameterValues && parameterValues[index];
            if (inputAssignment) {
                return inputAssignment;
            } else {
                return {constantValue: input.defaultValue, isValueUsed: true, resourceName: null};
            }
        });
    }

    private static getDefaultInputAssignments(operation: OperationState, lastInputAssignments: Array<InputAssignmentState>): Array<InputAssignmentState> {
        return operation.inputs.map((input, index): InputAssignmentState => {
            const lastInputAssignment = lastInputAssignments && lastInputAssignments[index];
            if (typeof input.defaultValue !== 'undefined') {
                return {constantValue: input.defaultValue, isValueUsed: true, resourceName: null};
            } else {
                return lastInputAssignment || {constantValue: null, isValueUsed: true, resourceName: null};
            }
        });
    }

    private close(dialogId: string) {
        this.setState(Object.assign({}, this.state, {isOpen: false}), () => {
            this.props.onClose(dialogId, this.state);
        });
    }

    private handleConfirm() {
        this.close(this.props.isAddOpStepDialog ? 'add' : 'edit');
    }

    private handleCancel() {
        this.close(null);
    }

    //noinspection JSMethodCanBeStatic
    private handleValidate() {
        console.log('EditOpStepDialog: validating inputs (TODO!)');
    }

    private handleDefaults() {
        const inputAssignments = EditOpStepDialog.getDefaultInputAssignments(this.props.operation, this.props.inputAssignments);
        this.setState(Object.assign({}, this.state, {inputAssignments}));
    }

    private requiresDatasetResources() {
        return this.props.operation.inputs.some(input => {
            const hasDefaultValue = input.defaultValue || input.defaultValue === null;
            return !hasDefaultValue && EditOpStepDialog.isDatasetDataType(input.dataType)
        });
    }

    private hasDatasetResources() {
        return this.props.workspace.resources.some(resource => EditOpStepDialog.isDatasetDataType(resource.dataType));
    }

    private static isDatasetDataType(dataType: string): boolean {
        return dataType && dataType.endsWith('Dataset');
    }

    render() {
        const operation = this.props.operation;
        const parameterPanel = this.renderParameterPanel();

        const dialogTitle = this.props.isAddOpStepDialog ? "Add Workflow Step" : "Change Workflow Step";
        const tooltipText = this.props.isAddOpStepDialog ? 'Add a new step to the workflow' : 'Change the step parameters.';

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

        return (
            <Dialog
                isOpen={this.state.isOpen}
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
            console.log('EditOpStepDialog: handleValidationFailure', textValue, error);
            actions.showMessageBox({title: 'Input Error', message: error + ''}, actions.MESSAGE_BOX_NO_REPLY);
        };

        const changeInputAssignment = (index: number, inputAssignment: InputAssignmentState) => {
            const inputAssignments = this.state.inputAssignments.slice();
            const newInputAssignment = Object.assign({}, inputAssignments[index], inputAssignment);
            console.log('EditOpStepDialog: changeInputAssignment', newInputAssignment);
            inputAssignments[index] = newInputAssignment;
            this.setState({inputAssignments});
        };

        const changeInputResourceName = (input: OperationInputState, index: number, resourceName: string, isValueUsed: boolean) => {
            if (resourceName === '' && input.nullable) {
                resourceName = null;
            }
            changeInputAssignment(index, {resourceName, isValueUsed} as InputAssignmentState);
        };

        const changeInputConstantValue = (input: OperationInputState, index: number, value: any) => {
            if (value === '' && input.nullable) {
                value = null;
            }
            if (value === null && !input.nullable) {
                handleValidationFailure(null, `A value is required for input "${input.name}"`);
                return;
            }
            changeInputAssignment(index, {constantValue: value, isValueUsed: true} as InputAssignmentState);
        };

        const changeInputIntValue = (input: OperationInputState, index: number, value: number|null) => {
            // TODO (forman): perform validation against input.valueRange, if any
            changeInputConstantValue(input, index, value);
        };

        const changeInputFloatValue = (input: OperationInputState, index: number, value: number|null) => {
            // TODO (forman): perform validation against input.valueRange, if any
            changeInputConstantValue(input, index, value);
        };

        const inputEditors = operation.inputs.map((input: OperationInputState, index: number) => {
            const parameterValue = this.state.inputAssignments[index];
            const constantValue = parameterValue.constantValue;
            let valueEditor = null;
            switch (input.dataType) {
                case 'int':
                    valueEditor = EditOpStepDialog.renderIntInputEditor(input, index, constantValue, changeInputIntValue, handleValidationFailure);
                    break;
                case 'float':
                    valueEditor = EditOpStepDialog.renderFloatInputEditor(input, index, constantValue, changeInputFloatValue, handleValidationFailure);
                    break;
                case 'bool': {
                    valueEditor = EditOpStepDialog.renderBoolInputEditor(input, index, constantValue, changeInputConstantValue);
                    break;
                }
                case 'str': {
                    // TODO (forman): note the following is a naive decision making, because we don't use input.fileMode yet
                    if (input.name.toLowerCase().endsWith('file')) {
                        let showFileCallback: ShowFileCallback;
                        if (operation.name.toLowerCase().startsWith('read')
                            || operation.name.toLowerCase().startsWith('open')
                            || operation.name.toLowerCase().startsWith('load')) {
                            showFileCallback = EditOpStepDialog.showOpenDialog;
                        } else {
                            showFileCallback = EditOpStepDialog.showSaveDialog;
                        }
                        valueEditor = EditOpStepDialog.renderFileInputEditor(input, index, constantValue, changeInputConstantValue, showFileCallback);
                    } else {
                        valueEditor = EditOpStepDialog.renderStringInputEditor(input, index, constantValue, changeInputConstantValue, handleValidationFailure);
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
                                 onChange={(resourceName, isValueUsed) => changeInputResourceName(input, index, resourceName, isValueUsed)}
                                 isValueEditorShown={parameterValue.isValueUsed}
                                 resourceName={parameterValue.resourceName}
                                 valueEditor={valueEditor}/>
            );
        });
        return (<div>{inputEditors}</div>);
    }

    private static renderBoolInputEditor(input: OperationInputState,
                                         index: number,
                                         value: boolean,
                                         onChange: EditorCallback) {
        return (
            <Checkbox checked={value || false}
                      onChange={(event:any) => onChange(input, index, event.target.checked)}/>
        );
    }

    private static renderIntInputEditor(input: OperationInputState,
                                        index: number,
                                        value: number|null,
                                        onChange: EditorCallback,
                                        onFailure: FailureCallback) {
        const valueSetEditor = this.renderValueSetEditor(input, index, value, onChange);
        if (valueSetEditor) {
            return valueSetEditor;
        }
        return (
            <IntField textAlign="right"
                      columns={8}
                      value={value}
                      onChange={(value:number|null) => onChange(input, index, value)}
                      onFailure={onFailure}
            />
        );
    }

    private static renderFloatInputEditor(input: OperationInputState,
                                          index: number,
                                          value: number|null,
                                          onChange: EditorCallback,
                                          onFailure: FailureCallback) {
        const valueSetEditor = this.renderValueSetEditor(input, index, value, onChange);
        if (valueSetEditor) {
            return valueSetEditor;
        }
        return (
            <FloatField textAlign="right"
                        columns={8}
                        value={value}
                        onChange={(value:number|null) => onChange(input, index, value)}
                        onFailure={onFailure}
            />
        );
    }

    private static renderStringInputEditor(input: OperationInputState,
                                           index: number,
                                           value: string|null,
                                           onChange: EditorCallback,
                                           onFailure: FailureCallback) {
        const valueSetEditor = this.renderValueSetEditor(input, index, value, onChange);
        if (valueSetEditor) {
            return valueSetEditor;
        }
        return (
            <TextField columns={10}
                       value={value}
                       onChange={(value:string|null) => onChange(input, index, value)}
                       onFailure={onFailure}
            />
        );
    }

    private static renderValueSetEditor(input: OperationInputState,
                                        index: number,
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
                            onChange={(event:any) => onChange(input, index, event.target.value === NULL_VALUE ? null : event.target.value)}>
                        {options}
                    </select>
                </div>
            );
        }
        return null;
    }

    private static renderFileInputEditor(input: OperationInputState,
                                         index: number,
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
                       onChange={(event:any) => onChange(input, index, event.target.value)}
                />
                <Button className="pt-intent-primary" style={{flex: 'none'}}
                        onClick={() => showFileDialog(input, index, value || '', onChange)}>...</Button>
            </div>
        );
    }

    private static showOpenDialog(input: OperationInputState,
                                  index: number,
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
                onChange(input, index, filePath);
            }
        });
    }

    private static showSaveDialog(input: OperationInputState,
                                  index: number,
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
                onChange(input, index, filePath);
            }
        });
    }

}
