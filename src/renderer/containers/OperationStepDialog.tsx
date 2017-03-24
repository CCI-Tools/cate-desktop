import * as React from 'react';
import {connect} from "react-redux";
import {Button} from "@blueprintjs/core";
import {
    OperationState, WorkspaceState, OperationInputState, State, DialogState, OperationKWArgs,
    ResourceState
} from "../state";
import FormEvent = React.FormEvent;
import {InputEditor} from "./editor/InputEditor";
import {updatePropertyObject} from "../../common/objutil";
import {ModalDialog} from "../components/ModalDialog";
import {Field} from "../components/field/Field";
import {hasValueEditorFactory, InputAssignment, InputAssignments, renderValueEditor} from "./editor/ValueEditor";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {isDefined, isUndefinedOrNull} from "../../common/types";


type InputErrors = { [inputName: string]: Error };

type OpInputAssignments = { [opName: string]: InputAssignments };

interface IOperationStepDialogOwnProps {
    isAddDialog?: boolean;
}

interface IOperationStepDialogProps extends DialogState, IOperationStepDialogOwnProps {
    dispatch?: any;
    inputAssignments: OpInputAssignments;
    workspace: WorkspaceState;
    operation: OperationState;
    newResourceName: string,
}

interface IOperationStepDialogState {
    inputAssignments: InputAssignments;
    inputErrors?: InputErrors;
    isValidationDialogOpen?: boolean;
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

class OperationStepDialog extends React.Component<IOperationStepDialogProps, IOperationStepDialogState> {
    static readonly DIALOG_ID = 'operationStepDialog';

    constructor(props: IOperationStepDialogProps) {
        super(props);
        this.onCancel = this.onCancel.bind(this);
        this.onValidate = this.onValidate.bind(this);
        this.onDefaults = this.onDefaults.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.hideValidationDialog = this.hideValidationDialog.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.renderExtraActions = this.renderExtraActions.bind(this);
        this.onConstantValueChange = this.onConstantValueChange.bind(this);
        this.onResourceNameChange = this.onResourceNameChange.bind(this);
        this.state = OperationStepDialog.mapPropsToState(props);
    }

    componentWillReceiveProps(nextProps: IOperationStepDialogProps) {
        this.setState(OperationStepDialog.mapPropsToState(nextProps));
    }

    static mapPropsToState(props: IOperationStepDialogProps): IOperationStepDialogState {
        const operation = props.operation;
        const inputAssignments = (props.inputAssignments && props.inputAssignments[operation.name])
            || getInitialInputAssignments(operation.inputs);
        return {inputAssignments} as any;
    }

    private onConfirm() {
        const operation = this.props.operation;
        const resName = this.props.newResourceName;
        const opName = operation.name;
        const opArgs = this.getInputArguments();
        console.log(`OperationStepDialog: handleConfirm: op="${opName}", args=${opArgs}`);
        this.props.dispatch(actions.hideOperationStepDialog({[opName]: this.state.inputAssignments}));
        this.props.dispatch(actions.setWorkspaceResource(resName, opName, opArgs, `Applying operation "${opName}"`));
    }

    private canConfirm() {
        return !this.getInputErrors();
    }

    private onCancel() {
        this.props.dispatch(actions.hideOperationStepDialog());
    }

    private onValidate() {
        let inputErrors = this.getInputErrors();
        console.log('onValidate: inputErrors: ', inputErrors);

        this.setState({isValidationDialogOpen: true, inputErrors} as any);
    }

    private hideValidationDialog() {
        this.setState({isValidationDialogOpen: false} as any);
    }

    private getInputArguments(): OperationKWArgs {
        return getInputArguments(this.props.operation.inputs, this.state.inputAssignments);
    }

    private getInputErrors(): { [name: string]: Error } {
        return getInputErrors(this.props.operation.inputs, this.state.inputAssignments);
    }

    private onDefaults() {
        const inputAssignments = getInitialInputAssignments(this.props.operation.inputs, this.state.inputAssignments, true);
        this.setState({inputAssignments} as any);
    }

    private setInputAssignment(input: OperationInputState, inputAssignment: InputAssignment) {
        //console.log('OperationStepDialog: setInputAssignment: inputAssignment =', inputAssignment);
        const inputAssignments = updatePropertyObject(this.state.inputAssignments, input.name, inputAssignment);
        //console.log('OperationStepDialog: setInputAssignment: inputAssignments =', inputAssignments);
        this.setState({inputAssignments} as any);
    };

    private onResourceNameChange(input: OperationInputState, resourceName: string, isValueUsed: boolean) {
        if (resourceName === '' && input.nullable) {
            resourceName = null;
        }
        this.setInputAssignment(input, {resourceName, isValueUsed} as InputAssignment);
    }

    private onConstantValueChange(input: OperationInputState, value: any) {
        this.setInputAssignment(input, {constantValue: value, isValueUsed: true} as InputAssignment);
    }

    render() {
        if (!this.props.isOpen) {
            return null;
        }

        const dialogTitle = this.props.isAddDialog ? "Add Operation Step" : "Change Operation Step";
        const tooltipText = this.props.isAddDialog ? 'Add a new operation step to the workflow' : 'Change the operation step parameters.';

        return (
            <ModalDialog
                isOpen={this.props.isOpen}
                iconName="function"
                title={dialogTitle}
                confirmTooltip={tooltipText}
                confirmTitle="Apply"
                confirmIconName="play"
                onConfirm={this.onConfirm}
                onCancel={this.onCancel}
                canConfirm={this.canConfirm}
                renderBody={this.renderBody}
                renderExtraActions={this.renderExtraActions}
            />
        );
    }

    renderBody() {
        const operation = this.props.operation;

        const bodyHeaderText = (
            <p key='header' style={{marginBottom: '1em'}}>
                Adjustable parameter(s) for operation <code>{operation.name}</code>:
            </p>
        );

        const bodyFooterText = (
            <p key='footer' style={{marginTop: '1em'}}>
                Pressing <span className="pt-icon-play"/> will add operation <code>{operation.name}</code> as a new
                workflow step to the current workspace. The result of the step is a new <em>resource</em> which can
                be
                used as input for other operations. You can remove the step or change it's parameters later.
            </p>
        );

        const parameterPanel = this.renderParameterPanel();

        return (
            <div className="pt-form-group">
                {bodyHeaderText}
                <div className="pt-form-content">
                    {parameterPanel}
                    <div className="pt-form-helper-text">{bodyFooterText}</div>
                </div>
                <ValidationDialog isOpen={this.state.isValidationDialogOpen}
                                  inputErrors={this.state.inputErrors}
                                  onConfirm={this.hideValidationDialog}
                />
            </div>
        );
    }

    renderExtraActions() {
        return [
            <Button key='validate' onClick={this.onValidate}>Validate</Button>,
            <Button key='defaults' onClick={this.onDefaults}>Defaults</Button>
        ];
    }

    renderParameterPanel(): JSX.Element {
        const operation = this.props.operation;
        if (!operation.inputs || !operation.inputs.length) {
            return null;
        }
        const inputEditors = renderInputEditors(
            operation.inputs,
            this.state.inputAssignments,
            this.props.workspace.resources,
            this.onConstantValueChange,
            this.onResourceNameChange
        );
        return (<div key='parameterPanel'>{inputEditors}</div>);
    }
}

export default connect(mapStateToProps)(OperationStepDialog);

function getInitialInputAssignments(inputs: OperationInputState[],
                                    lastInputAssignments?: InputAssignments,
                                    forceDefaults?: boolean) {
    const inputAssignments = {};
    inputs.forEach((input: OperationInputState) => {
        const isValueUsed = hasValueEditorFactory(input.dataType);
        const hasDefaultValue = isDefined(input.defaultValue);
        const constantValue = hasDefaultValue ? input.defaultValue : null;
        const resourceName = null;
        const defaultInputAssignment = {constantValue, isValueUsed, resourceName};
        const lastInputAssignment = lastInputAssignments && lastInputAssignments[input.name];
        let inputAssignment;
        if (!lastInputAssignment || forceDefaults) {
            inputAssignment = defaultInputAssignment;
        } else {
            inputAssignment = lastInputAssignment || defaultInputAssignment;
        }
        inputAssignments[input.name] = inputAssignment;
    });
    return inputAssignments;
}

function renderInputEditors(inputs: OperationInputState[],
                            inputAssignments: InputAssignments,
                            resources: ResourceState[],
                            onConstantValueChange,
                            onResourceNameChange): JSX.Element[] {
    return inputs.map((input: OperationInputState) => {
        const inputAssignment = inputAssignments[input.name];
        const constantValue = inputAssignment.constantValue;
        const valueEditor = renderValueEditor({input, inputAssignments, resources, value: constantValue, onChange: onConstantValueChange});
        return (
            <InputEditor key={input.name}
                         resources={resources}
                         name={input.name}
                         dataType={input.dataType}
                         units={input.units}
                         tooltipText={input.description}
                         onChange={(resourceName, isValueUsed) => onResourceNameChange(input, resourceName, isValueUsed)}
                         isValueEditorShown={inputAssignment.isValueUsed}
                         resourceName={inputAssignment.resourceName}
                         valueEditor={valueEditor}/>
        );
    });
}

function getInputArguments(inputs: OperationInputState[],
                           inputAssignments: InputAssignments): OperationKWArgs {
    const inputArguments = {};
    inputs.forEach((input) => {
        const inputAssignment = inputAssignments[input.name];
        if (inputAssignment) {
            let inputArgument;
            if (inputAssignment.isValueUsed) {
                const constantValue = inputAssignment.constantValue;
                const value = Field.isFieldValue(constantValue) ? constantValue.value : constantValue;
                inputArgument = {value};
            } else {
                inputArgument = {source: inputAssignment.resourceName};
            }
            inputArguments[input.name] = inputArgument;
        }
    });
    return inputArguments;
}

function getInputErrors(inputs: OperationInputState[],
                        inputAssignments: InputAssignments): InputErrors {
    let inputErrors = {};
    let hasInputErrors = false;
    inputs.forEach((input) => {
        const inputAssignment = inputAssignments[input.name];
        console.log('inputAssignment: ', inputAssignment);
        if (inputAssignment) {
            if (inputAssignment.isValueUsed) {
                const constantValue = inputAssignment.constantValue;
                const error = Field.isFieldValue(constantValue) && constantValue.error;
                if (error) {
                    inputErrors[input.name] = error;
                    hasInputErrors = true;
                } else if (isUndefinedOrNull(constantValue) && !input.nullable) {
                    inputErrors[input.name] = new Error('Value must be given.');
                    hasInputErrors = true;
                }
            } else {
                const resourceName = inputAssignment.resourceName;
                if (isUndefinedOrNull(resourceName) && !input.nullable) {
                    inputErrors[input.name] = new Error('Resource must be specified.');
                    hasInputErrors = true;
                }
            }
        } else {
            inputErrors[input.name] = new Error('Value must be specified.');
            hasInputErrors = true;
        }
    });
    return hasInputErrors ? inputErrors : null;
}

interface IValidationDialogProps {
    isOpen: boolean;
    inputErrors: InputErrors;
    onConfirm: () => void;
}

class ValidationDialog extends React.Component<IValidationDialogProps, null> {

    constructor(props: IValidationDialogProps) {
        super(props);
        this.onConfirm = this.onConfirm.bind(this);
        this.renderBody = this.renderBody.bind(this);
    }

    private onConfirm() {
        this.props.onConfirm();
    }

    private countResourceProblems(): number {
        const inputErrors = this.props.inputErrors;
        let count = 0;
        Object.getOwnPropertyNames(inputErrors).forEach(inputName => {
            const error = inputErrors[inputName];
            if (error.message && (error.message.includes('resource') || error.message.includes('Resource'))) {
                count++;
            }
        });
        return count;
    }

    render() {
        return (
            <ModalDialog isOpen={this.props.isOpen}
                         title="Input Validation"
                         onConfirm={this.onConfirm}
                         noCancelButton={true}
                         onCancel={this.onConfirm}
                         renderBody={this.renderBody}/>
        );
    }

    private renderBody() {

        const inputErrors = this.props.inputErrors;
        if (!inputErrors) {
            return (<p>No problems encountered.</p>);
        }

        const problems = [];
        Object.getOwnPropertyNames(inputErrors).forEach(inputName => {
            let error = inputErrors[inputName];
            problems.push(<li key={inputName}>{inputName}: {error.message}</li>);
        });

        let introText;
        if (problems.length === 1) {
            introText = "The following problem has been encountered:";
        } else {
            introText = `The following ${problems.length} problems have been encountered:`;
        }

        const resourceProblems = this.countResourceProblems();
        const footerText = resourceProblems > 0 ? (<p>This operation has
               parameter(s) which require specifying a <em>resource</em>. When there are no compatible resources yet,
               you may consider opening a data source or use one of the <code>read_...</code> operations first.
            </p>) : null;

        return (
            <div className="pt-form-group">
                {introText}
                <div className="pt-form-content">
                    {problems}
                    <div className="pt-form-helper-text">{footerText}</div>
                </div>
            </div>
        );
    }
}

