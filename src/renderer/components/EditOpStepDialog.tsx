import * as React from 'react';
import {Dialog, Classes, Button, Tooltip, Checkbox} from "@blueprintjs/core";
import {DialogState, OperationState} from "../state";

interface IEditOpStepDialogProps {
    onClose: (actionId: string, dialogState: IEditOpStepDialogState) => void;
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
        this.state = {isOpen: true, parameterValues: props.parameterValues};
        this.dialogId = EditOpStepDialog.getDialogId(props.operation.name, props.isAddOpStepDialog);
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleValidate = this.handleValidate.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
    }

    static getDialogId(operationName: string, isAddOpStepDialog: boolean) {
        if (!operationName) {
            return null;
        }
        return (isAddOpStepDialog ? 'addOpStep_' : 'editOpStep_') + operationName;
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

    render() {

        const parameterPanel = this.renderParameterPanel();

        const dialogTitle = this.props.isAddOpStepDialog ? "Add Workflow Step" : "Change Workflow Step";
        const tooltipText = this.props.isAddOpStepDialog ? 'Add a new step to the workflow' : 'Change the step parameters.';

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
                    <p><strong>{this.props.operation.name}</strong> parameters:</p>
                    {parameterPanel}
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button onClick={this.handleCancel}>Cancel</Button>
                        <Button onClick={this.handleValidate}>Validate</Button>
                        <Tooltip content={tooltipText} inline>
                            <Button className="pt-intent-primary"
                                    onClick={this.handleConfirm}
                                    iconName="add">Add</Button>
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

        const createChild = (key: string, content: any) : JSX.Element => {
            return (<div key={key}
                         style={{display: 'flex' , padding: '0.2em'}}>{content}</div>);
        };

        const inputElems = operation.inputs.map(input => {
            switch (input.dataType) {
                case 'float':
                case 'int':
                case 'str': {
                    const nameField = <span key="n" style={{flex: 'auto'}}>{input.name}</span>;
                    const valueField = <input key="v" className="pt-input pt-intent-primary" type="text"/>;
                    return createChild(input.name, [nameField, valueField]);
                }
                case 'bool': {
                    return createChild(input.name, <Checkbox label={input.name}/>);
                }
                case 'Dataset': {
                    const nameField = <span key="n" style={{flex: 'auto'}}>{input.name}</span>;
                    const valueField = (
                        <div key="v" className="pt-select pt-intent-primary">
                            <select>
                                <option key="0" value="_">Select dataset...</option>
                                <option key="1" value="ds_1">ds_1</option>
                                <option key="2" value="ds_2">ds_2</option>
                                <option key="3" value="ds_3">ds_3</option>
                                <option key="4" value="ds_4">ds_4</option>
                            </select>
                        </div>);
                    return createChild(input.name, [nameField, valueField]);
                }
            }
        });
        return (<div>{inputElems}</div>);
    }
}
