import * as React from 'react';
import {Dialog, Classes, Button, Tooltip, Checkbox} from "@blueprintjs/core";
import {DialogState, OperationState, WorkspaceState, OperationInputState} from "../state";
import FormEvent = React.FormEvent;
import {ParameterEditor} from "../components/ParameterEditor";
import {FloatField} from "../components/FloatField";
import {IntField} from "../components/IntField";
import {TextField} from "../components/TextField";


interface ParameterValueState {
    constantValue: any;
    resourceName: string;
    isValueUsed: boolean;
}

type EditorCallback = (input: OperationInputState, index: number, value: any) => any;

export interface IEditOpStepDialogProps {
    onClose: (actionId: string, dialogState: IEditOpStepDialogState) => void;
    workspace: WorkspaceState;
    operation: OperationState;
    isAddOpStepDialog: boolean;
    parameterValues: Array<ParameterValueState>;
}

export interface IEditOpStepDialogState extends DialogState {
    parameterValues: Array<ParameterValueState>;
}

export class EditOpStepDialog extends React.Component<IEditOpStepDialogProps, IEditOpStepDialogState> {
    private readonly dialogId: string;

    constructor(props: IEditOpStepDialogProps) {
        super(props);
        const parameterValues = EditOpStepDialog.getInitialParameterValues(props.operation, props.parameterValues);
        this.state = {isOpen: true, parameterValues};
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

    private static getInitialParameterValues(operation: OperationState, parameterValues: Array<ParameterValueState>) {
        return operation.inputs.map((input, index): ParameterValueState => {
            const parameterValue = parameterValues && parameterValues[index];
            if (parameterValue) {
                return parameterValue;
            } else {
                return {constantValue: input.defaultValue, isValueUsed: true, resourceName: null};
            }
        });
    }

    private static getDefaultParameterValues(operation: OperationState, parameterValues: Array<ParameterValueState>): Array<ParameterValueState> {
        return operation.inputs.map((input, index): ParameterValueState => {
            const parameterValue = parameterValues && parameterValues[index];
            if (typeof input.defaultValue !== 'undefined') {
                return {constantValue: input.defaultValue, isValueUsed: true, resourceName: null};
            } else {
                return parameterValue || {constantValue: null, isValueUsed: true, resourceName: null};
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
        const parameterValues = EditOpStepDialog.getDefaultParameterValues(this.props.operation, this.props.parameterValues);
        this.setState(Object.assign({}, this.state, {parameterValues}));
    }

    private getMandatoryDatasetInputs() {
        const mandatoryDatasetInputs = [];
        for (let input of this.props.operation.inputs) {
            const hasDefaultValue = input.defaultValue || input.defaultValue === null;
            if (input.dataType.endsWith('Dataset') && !hasDefaultValue) {
                mandatoryDatasetInputs.push(input);
            }
        }
        return mandatoryDatasetInputs;
    }

    private getAvailableDatasetResources() {
        const steps = this.props.workspace.workflow.steps;
        return steps.map(step => step.id);
    }

    render() {
        const operation = this.props.operation;
        const parameterPanel = this.renderParameterPanel();

        const dialogTitle = this.props.isAddOpStepDialog ? "Add Workflow Step" : "Change Workflow Step";
        const tooltipText = this.props.isAddOpStepDialog ? 'Add a new step to the workflow' : 'Change the step parameters.';

        const mandatoryDatasetInputs = this.getMandatoryDatasetInputs();
        const hasAvailableDatasetResources = this.getAvailableDatasetResources().length > 0;

        const bodyHeaderText = (
            <p style={{marginBottom: '1em'}}>
                Adjustable parameter(s) for operation <code>{operation.name}</code>:
            </p>
        );

        let validationFailed = false;
        let bodyFooterText;
        if (mandatoryDatasetInputs.length && !hasAvailableDatasetResources) {
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

        const changeParameterConstantValue = (input: OperationInputState, index: number, value: any) => {
            if (value === '' && input.nullable) {
                value = null;
            }
            const parameterValues = this.state.parameterValues.slice();
            parameterValues[index] = Object.assign({}, parameterValues[index], {
                constantValue: value,
                isValueUsed: true
            });
            this.setState({parameterValues});
        };

        const changeParameterIntValue = (input: OperationInputState, index: number, value: number|null) => {
            if (value === null) {
                if (input.nullable) {
                    changeParameterConstantValue(input, index, null);
                } else {
                    // inform user
                    console.error('EditOpStepDialog: empty value for non-nullable int input');
                }
            } else {
                changeParameterConstantValue(input, index, value);
            }
        };

        const changeParameterFloatValue = (input: OperationInputState, index: number, value: number|null) => {
            if (value === null) {
                if (input.nullable) {
                    changeParameterConstantValue(input, index, null);
                } else {
                    // inform user
                    console.error('EditOpStepDialog: empty value for non-nullable float input');
                }
            } else {
                changeParameterConstantValue(input, index, value);
            }
        };

        const changeParameterTextValue = (input: OperationInputState, index: number, value: string|null) => {
            if (value === null) {
                if (input.nullable) {
                    changeParameterConstantValue(input, index, null);
                } else {
                    // inform user
                    console.error('EditOpStepDialog: empty value for non-nullable text input');
                }
            } else {
                changeParameterConstantValue(input, index, value);
            }
        };

        const changeParameterResourceName = (index: number, resourceName: string, isValueUsed: boolean) => {
            const parameterValues = this.state.parameterValues.slice();
            parameterValues[index] = Object.assign({}, parameterValues[index], {resourceName, isValueUsed});
            this.setState({parameterValues});
        };

        const inputEditors = operation.inputs.map((input: OperationInputState, index: number) => {
            const parameterValue = this.state.parameterValues[index];
            const constantValue = parameterValue.constantValue;
            let valueEditor = null;
            switch (input.dataType) {
                case 'int':
                    valueEditor = EditOpStepDialog.renderIntInputEditor(input, index, constantValue, changeParameterIntValue);
                    break;
                case 'float':
                    valueEditor = EditOpStepDialog.renderFloatInputEditor(input, index, constantValue, changeParameterFloatValue);
                    break;
                case 'bool': {
                    valueEditor = EditOpStepDialog.renderBoolInputEditor(input, index, constantValue, changeParameterConstantValue);
                    break;
                }
                case 'str': {
                    // Note the following is a naive decision making, because we are lacking a real file/path type :(
                    if (input.name.toLowerCase().endsWith('file')) {
                        valueEditor = EditOpStepDialog.renderFileInputEditor(input, index, constantValue, changeParameterTextValue);
                    } else {
                        valueEditor = EditOpStepDialog.renderStringInputEditor(input, index, constantValue, changeParameterTextValue);
                    }
                    break;
                }
            }
            return (<ParameterEditor key={index}
                                     resources={this.props.workspace.resources}
                                     name={input.name}
                                     dataType={input.dataType}
                                     units={input.units}
                                     tooltipText={input.description}
                                     onChange={(resourceName, isValueUsed) => changeParameterResourceName(index, resourceName, isValueUsed)}
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
                                        onChange: EditorCallback) {
        const valueSetEditor = this.renderValueSetEditor(input, index, value, onChange);
        if (valueSetEditor) {
            return valueSetEditor;
        }
        return (
            <IntField textAlign="right"
                      columns={8}
                      value={value}
                      onChange={(value:number|null) => onChange(input, index, value)}
            />
        );
    }

    private static renderFloatInputEditor(input: OperationInputState,
                                          index: number,
                                          value: number|null,
                                          onChange: EditorCallback) {
        const valueSetEditor = this.renderValueSetEditor(input, index, value, onChange);
        if (valueSetEditor) {
            return valueSetEditor;
        }
        return (
            <FloatField textAlign="right"
                        columns={8}
                        value={value}
                        onChange={(value:number|null) => onChange(input, index, value)}
            />
        );
    }

    private static renderStringInputEditor(input: OperationInputState,
                                           index: number,
                                           value: string|null,
                                           onChange: EditorCallback) {
        const valueSetEditor = this.renderValueSetEditor(input, index, value, onChange);
        if (valueSetEditor) {
            return valueSetEditor;
        }
        return (
            <TextField columns={10}
                       value={value}
                       onChange={(value:string|null) => onChange(input, index, value)}
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
                                         onChange: EditorCallback) {
        const browseFile = () => {
            const electron = require('electron');
            console.log('EditOpStepDialog: contacting main process...', electron);
            // see https://github.com/electron/electron/blob/master/docs/api/dialog.md
            const openDialogOptions = {
                title: "Select File Path",
                defaultPath: value,
                buttonLabel: "Select File",
                properties: ["openFile"],
            };
            electron.ipcRenderer.send('show-open-dialog', openDialogOptions);
            electron.ipcRenderer.on('show-open-dialog-reply', (event, filePaths: Array<string>) => {
                console.log('EditOpStepDialog: received reply from main process:', filePaths);
                if (filePaths && filePaths.length) {
                    onChange(input, index, filePaths[0]);
                }
            });
        };

        return (
            <div className="pt-control-group" style={{width: '20em', display: 'flex'}}>
                <input className="pt-input"
                       type="text"
                       style={{flexGrow: 1}}
                       value={value || ''}
                       placeholder="Enter local file path"
                       onChange={(event:any) => onChange(input, index, event.target.value)}
                />
                <Button className="pt-intent-primary" style={{flex: 'none'}} onClick={browseFile}>...</Button>
            </div>
        );
    }
}
