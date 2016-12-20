import * as React from 'react';
import {Dialog, Classes, Button, Tooltip, Switch} from "@blueprintjs/core";
import {DialogState, OperationState, WorkspaceState, OperationInputState} from "../state";
import FormEvent = React.FormEvent;

interface IEditOpStepDialogProps {
    onClose: (actionId: string, dialogState: IEditOpStepDialogState) => void;
    workspace: WorkspaceState;
    operation: OperationState;
    isAddOpStepDialog: boolean;
    parameterValues: any;
}

export interface IEditOpStepDialogState extends DialogState {
    parameterValues: any;
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

    private static getInitialParameterValues(operation, parameterValues) {
        return operation.inputs.map((input, index) =>
            parameterValues && typeof parameterValues[index] !== 'undefined'
                ? parameterValues[index]
                : input.defaultValue);
    }

    private static getDefaultParameterValues(operation, parameterValues) {
        return operation.inputs.map((input, index) =>
            typeof input.defaultValue !== 'undefined'
                ? input.defaultValue
                : (parameterValues && parameterValues[index]));
    }

    private close(dialogId: string) {
        const parameterValues = [];

        this.setState(Object.assign({}, this.state, {isOpen: false, parameterValues}), () => {
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
        this.setState({parameterValues});
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

        const steps = this.props.workspace.workflow.steps;
        const firstDatasetOption = (<option key='__first__' value=''>Select dataset...</option>);
        const stepOptions = steps.map(step => <option key={step.id} value={step.id}>{step.id}</option>);
        const datasetOptions = [firstDatasetOption].concat(stepOptions);

        const createChild = (key: string, content: any): JSX.Element => {
            return (<div key={key}
                         style={{display: 'flex' , padding: '0.2em'}}>{content}</div>);
        };

        const changeParameterValue = (index: number, newValue: any) => {
            const parameterValues = this.state.parameterValues.slice();
            parameterValues[index] = newValue;
            this.setState({parameterValues});
        };

        const parameterValues = this.state.parameterValues;

        const inputElems = operation.inputs.map((input: OperationInputState, index: number) => {
            const value = parameterValues[index];
            switch (input.dataType) {
                case 'float':
                case 'int':
                case 'str': {
                    const nameField = <span key="n" style={{flex: 'auto'}}>{input.name}</span>;
                    const valueField = (<input key="v"
                                               className="pt-input pt-intent-primary"
                                               type="text"
                                               value={value}
                                               onChange={(event:any) => changeParameterValue(index, event.target.value)}/>);
                    return createChild(input.name, [nameField, valueField]);
                }
                case 'bool': {
                    return createChild(input.name, (
                        <Switch label={input.name}
                                checked={value}
                                onChange={(event:any) => changeParameterValue(index, event.target.value === 'on')}/>
                    ));
                }
                case 'Dataset': {
                    const nameField = <span key="n" style={{flex: 'auto'}}>{input.name}</span>;
                    const valueField = (
                        <div key="v" className="pt-select pt-intent-primary">
                            <select value={value}
                                    onChange={(event:any) => changeParameterValue(index, event.target.value)}>
                                {datasetOptions}
                            </select>
                        </div>);
                    return createChild(input.name, [nameField, valueField]);
                }
            }
        });
        return (<div>{inputElems}</div>);
    }
}
