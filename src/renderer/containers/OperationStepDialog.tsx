import * as React from 'react';
import {connect, DispatchProp} from "react-redux";
import {AnchorButton, Tooltip} from "@blueprintjs/core";
import {
    OperationState, WorkspaceState, OperationInputState, State, DialogState, OperationKWArgs,
    ResourceState, WorkflowStepState
} from "../state";
import {InputEditor} from "./editor/InputEditor";
import {updatePropertyObject} from "../../common/objutil";
import {ModalDialog} from "../components/ModalDialog";
import {isFieldValue} from "../components/field/Field";
import {
    GeometryWKTGetter, hasValueEditorFactory, InputAssignment, InputAssignments,
    renderValueEditor
} from "./editor/ValueEditor";
import * as actions from "../actions";
import * as selectors from "../selectors";
import {isDefined, isString, isUndefinedOrNull} from "../../common/types";
import {isUndefined} from "../../common/types";

export const NEW_OPERATION_STEP_DIALOG_ID = "newOperationStepDialog";
export const NEW_CTX_OPERATION_STEP_DIALOG_ID = "newCtxOperationStepDialog";
export const EDIT_OPERATION_STEP_DIALOG_ID = "editOperationStepDialog";

type InputErrors = { [inputName: string]: Error };

interface IOperationStepDialogOwnProps {
    id: string;
    operationStep?: WorkflowStepState | null;
}

interface IOperationStepDialogProps extends DialogState, IOperationStepDialogOwnProps {
    operation?: OperationState;
    inputAssignments?: InputAssignments;
    workspace: WorkspaceState;
    resName: string;
    geometryWKTGetter: GeometryWKTGetter;
}

interface IOperationStepDialogState {
    inputAssignments: InputAssignments;
    inputErrors?: InputErrors;
    isValidationDialogOpen?: boolean;
}

function mapStateToProps(state: State, ownProps: IOperationStepDialogOwnProps): IOperationStepDialogProps {
    const id = ownProps.id;
    const dialogState = selectors.dialogStateSelector(id)(state);
    const isOpen = dialogState.isOpen;

    if (!isOpen) {
        return {id, isOpen: false} as any;
    }

    let operation, inputAssignments, resName = null;
    if (id === NEW_OPERATION_STEP_DIALOG_ID) {
        operation = selectors.selectedOperationSelector(state);
        if (!operation) {
            console.error("OperationStepDialog: operation is undefined: dialog id =", id);
            return {id, isOpen: false} as any;
        }
        // Assign inputs from restored values
        const inputAssignmentsMap = (dialogState as any).inputAssignments;
        inputAssignments = inputAssignmentsMap && inputAssignmentsMap[operation.qualifiedName];
    } else if (id === NEW_CTX_OPERATION_STEP_DIALOG_ID) {
        operation = selectors.selectedCtxOperationSelector(state);
        if (!operation) {
            console.error("OperationStepDialog: operation is undefined: dialog id =", id);
            return {id, isOpen: false} as any;
        }
        // Assign inputs from context settings
        inputAssignments = (dialogState as any).inputAssignments;
    } else if (id === EDIT_OPERATION_STEP_DIALOG_ID) {
        const operationStep = ownProps.operationStep;
        operation = (selectors.operationsSelector(state) || [])
            .find(op => op.name === operationStep.op || op.qualifiedName === operationStep.op);
        if (!operation) {
            console.error("OperationStepDialog: operation is undefined: dialog id =", id);
            return {id, isOpen: false} as any;
        }
        inputAssignments = getInputAssignmentsFromOperationStep(operation, operationStep);
        resName = operationStep.id;
    } else {
        console.error("OperationStepDialog: unknown dialog id =", id);
        return {id, isOpen: false} as any;
    }

    const workspace = selectors.workspaceSelector(state);
    const geometryWKTGetter = selectors.selectedGeometryWKTGetterSelector(state);

    return {id, isOpen, workspace, geometryWKTGetter, resName, operation, inputAssignments};
}

class OperationStepDialog extends React.Component<IOperationStepDialogProps & DispatchProp<State>, IOperationStepDialogState> {

    private static readonly NO_STATE = {inputAssignments: {}};

    constructor(props: IOperationStepDialogProps & DispatchProp<State>) {
        super(props);
        this.onConstantValueChange = this.onConstantValueChange.bind(this);
        this.onResourceNameChange = this.onResourceNameChange.bind(this);
        this.onCancel = this.onCancel.bind(this);
        this.onValidate = this.onValidate.bind(this);
        this.onDefaults = this.onDefaults.bind(this);
        this.onConfirm = this.onConfirm.bind(this);
        this.canConfirm = this.canConfirm.bind(this);
        this.hideValidationDialog = this.hideValidationDialog.bind(this);
        this.renderBody = this.renderBody.bind(this);
        this.renderExtraActions = this.renderExtraActions.bind(this);
        this.state = OperationStepDialog.mapPropsToState(props);
    }

    componentWillReceiveProps(nextProps: IOperationStepDialogProps) {
        this.setState(OperationStepDialog.mapPropsToState(nextProps));
    }

    static mapPropsToState(props: IOperationStepDialogProps): IOperationStepDialogState {
        if (!props.isOpen) {
            return OperationStepDialog.NO_STATE;
        }
        const operation = props.operation;
        const inputAssignments = getInitialInputAssignments(operation.inputs, props.inputAssignments, false);
        return {inputAssignments};
    }

    private onConfirm() {
        const isEditMode = this.props.id === EDIT_OPERATION_STEP_DIALOG_ID;
        const isNewMode = !isEditMode;
        const operation = this.props.operation;
        let inputAssignmentsMap;
        if (isNewMode) {
            // Only store input assignments when creating new operation steps
            inputAssignmentsMap = {[operation.qualifiedName]: this.state.inputAssignments};
        }
        this.props.dispatch(actions.hideOperationStepDialog(this.props.id, inputAssignmentsMap));
        this.props.dispatch(actions.setWorkspaceResource(operation.qualifiedName,
                                                         this.getInputArguments(),
                                                         this.props.resName,
                                                         isEditMode,
                                                         `Executing operation "${operation.name}"`));
    }

    private canConfirm() {
        return !this.getInputErrors();
    }

    private onCancel() {
        this.props.dispatch(actions.hideOperationStepDialog(this.props.id));
    }

    private onValidate() {
        let inputErrors = this.getInputErrors();
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
        const inputAssignments = getInitialInputAssignments(this.props.operation.inputs,
                                                            this.state.inputAssignments, true);
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
        const isOpen = this.props.isOpen;
        if (!isOpen) {
            return null;
        }

        const operation = this.props.operation;
        let confirmTitle, dialogTitle, tooltipText;
        if (this.props.id === EDIT_OPERATION_STEP_DIALOG_ID) {
            confirmTitle = 'Edit Step';
            dialogTitle = `Edit Operation Step - ${operation.name}`;
            tooltipText = 'Edit operation step inputs and recompute output.';
        } else {
            confirmTitle = 'Add Step';
            dialogTitle = `Add Operation Step - ${operation.name}`;
            tooltipText = 'Add a new operation step to the workspace\'s workflow.';
        }

        return (
            <ModalDialog
                isOpen={true}
                iconName="function"
                title={dialogTitle}
                confirmTooltip={tooltipText}
                confirmTitle={confirmTitle}
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
        if (!this.props.isOpen) {
            return null;
        }

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
        if (!this.props.isOpen) {
            return null;
        }

        return [
            <Tooltip key='validate' content="Validate current input values">
                <AnchorButton onClick={this.onValidate}>Validate</AnchorButton>
            </Tooltip>,
            <Tooltip key='defaults' content="Set all inputs back to default values">
                <AnchorButton onClick={this.onDefaults}>Defaults</AnchorButton>
            </Tooltip>,
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
            this.props.geometryWKTGetter,
            this.onConstantValueChange,
            this.onResourceNameChange
        );
        return (<div key='parameterPanel'>{inputEditors}</div>);
    }
}

export default connect(mapStateToProps)(OperationStepDialog);

function getInputAssignmentsFromOperationStep(operation: OperationState, operationStep: WorkflowStepState): InputAssignments {
    const inputAssignments = {};
    for (let input of operation.inputs) {
        const inputPort = operationStep.inputs[input.name];
        if (inputPort) {
            const resourceName = isString(inputPort) ? inputPort : inputPort.source;
            if (resourceName) {
                inputAssignments[input.name] = {resourceName, isValueUsed: false};
            } else if (!isUndefined(inputPort.value)) {
                let constantValue = inputPort.value;
                inputAssignments[input.name] = {constantValue, isValueUsed: true};
            }
        }
    }
    return inputAssignments;
}

function getInitialInputAssignments(inputs: OperationInputState[],
                                    lastInputAssignments?: InputAssignments,
                                    forceDefaults?: boolean): InputAssignments {
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
                            geometryWKTGetter: GeometryWKTGetter,
                            onConstantValueChange,
                            onResourceNameChange): JSX.Element[] {
    return inputs
        .filter(input => !input.noUI)
        .map((input: OperationInputState) => {
            const inputAssignment = inputAssignments[input.name];
            const constantValue = inputAssignment.constantValue;
            const valueEditor = renderValueEditor({
                                                      input,
                                                      inputAssignments,
                                                      resources,
                                                      geometryWKTGetter,
                                                      value: constantValue,
                                                      onChange: onConstantValueChange
                                                  });
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
                const value = isFieldValue(constantValue) ? constantValue.value : constantValue;
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
        if (inputAssignment) {
            if (inputAssignment.isValueUsed) {
                const constantValue = inputAssignment.constantValue;
                const error = isFieldValue(constantValue) && constantValue.error;
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
    //console.log('getInputErrors: ', inputErrors);
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
        if (!this.props.isOpen) {
            return null;
        }

        const inputErrors = this.props.inputErrors;
        if (!inputErrors) {
            return (<p>No problems encountered.</p>);
        }
        const resourceProblems = this.countResourceProblems();
        const body = renderInputErrors(inputErrors, resourceProblems);
        if (!body) {
            return (<p>No problems encountered.</p>);
        }
        return body;
    }
}

export function renderInputErrors(inputErrors: InputErrors, resourceProblems?: number) {
    const problems = [];
    Object.getOwnPropertyNames(inputErrors).forEach(inputName => {
        let error = inputErrors[inputName];
        problems.push(<li key={inputName}>{inputName}: {error.message}</li>);
    });

    let introText;
    if (problems.length === 0) {
        return null;
    } else if (problems.length === 1) {
        introText = "The following problem has been encountered:";
    } else {
        introText = `The following ${problems.length} problems have been encountered:`;
    }

    const footerText = resourceProblems && resourceProblems > 0 ? (<p>This operation has
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

