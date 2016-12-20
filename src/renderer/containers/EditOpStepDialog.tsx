import * as React from 'react';
import {Dialog, Classes, Button, Tooltip, Switch, Checkbox} from "@blueprintjs/core";
import {DialogState, OperationState, WorkspaceState, OperationInputState} from "../state";
import FormEvent = React.FormEvent;
import {ParameterEditor} from "../components/ParameterEditor";


interface ParameterValueState {
    constantValue: any;
    resourceName: string;
    isValueUsed: boolean;
}

interface IEditOpStepDialogProps {
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
        console.log('EditOpStepDialog: Validating...');
    }

    private handleDefaults() {
        const parameterValues = EditOpStepDialog.getDefaultParameterValues(this.props.operation, this.props.parameterValues);
        this.setState(Object.assign({}, this.state, {parameterValues}));
    }

    private getMandatoryDatasetInputs() {
        const mandatoryDatasetInputs = [];
        for (let input of this.props.operation.inputs) {
            const hasDefaultValue = input.defaultValue || input.defaultValue === null;
            if (input.dataType === 'Dataset' && !hasDefaultValue) {
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

        const resources = this.props.workspace.resources;

        const changeParameterConstantValue = (index: number, constantValue: any) => {
            const parameterValues = this.state.parameterValues.slice();
            parameterValues[index] = Object.assign({}, parameterValues[index], {constantValue, isValueUsed: true});
            this.setState({parameterValues});
        };

        const changeParameterResourceName = (index: number, resourceName: string, isValueUsed: boolean) => {
            const parameterValues = this.state.parameterValues.slice();
            parameterValues[index] = Object.assign({}, parameterValues[index], {resourceName, isValueUsed});
            this.setState({parameterValues});
        };

        const inputElems = operation.inputs.map((input: OperationInputState, index: number) => {
            const parameterValue = this.state.parameterValues[index];
            let valueEditor = null;
            switch (input.dataType) {
                case 'float':
                case 'int':
                case 'str': {
                    valueEditor = (<input key="v"
                                          className="pt-input pt-intent-primary"
                                          type="text"
                                          value={parameterValue.constantValue}
                                          onChange={(event:any) => changeParameterConstantValue(index, event.target.value)}/>);
                    break;
                }
                case 'bool': {
                    valueEditor = (
                        <Checkbox checked={parameterValue.constantValue}
                                  onChange={(event:any) => changeParameterConstantValue(index, event.target.checked)}/>
                    );
                    break;
                }
                case 'Dataset': {
                    valueEditor = null;
                    break;
                }
            }
            return (<ParameterEditor resources={resources}
                                     name={input.name}
                                     dataType={input.dataType}
                                     onChange={(resourceName, isValueUsed) => changeParameterResourceName(index, resourceName, isValueUsed)}
                                     isValueEditorShown={parameterValue.isValueUsed}
                                     resourceName={parameterValue.resourceName}
                                     valueEditor={valueEditor}/>
            );
        });
        return (<div>{inputElems}</div>);
    }
}
