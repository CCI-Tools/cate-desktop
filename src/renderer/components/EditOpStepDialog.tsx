import * as React from 'react';
import {Dialog, Classes, Button, Tooltip} from "@blueprintjs/core";
import {DialogState, OperationState} from "../state";

interface IEditOpStepDialogProps {
    onClose: (actionId: string, dialogState: IEditOpStepDialogState) => void;
    operation: OperationState;
    isAddOpStepDialog: boolean;
}

export interface IEditOpStepDialogState extends DialogState {
}

export class EditOpStepDialog extends React.Component<IEditOpStepDialogProps, IEditOpStepDialogState> {
    private readonly dialogId: string;

    constructor(props: IEditOpStepDialogProps) {
        super(props);
        this.state = {isOpen: true};
        this.dialogId = EditOpStepDialog.getDialogId(props.operation.name, props.isAddOpStepDialog);
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
    }

    static getDialogId(operationName:string, isAddOpStepDialog: boolean) {
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

    render() {

        const operationParamPanel = (<p>TODO...</p>); // TODO

        const dialogTitle = this.props.isAddOpStepDialog ? "Add Workflow Step" : "Change Workflow Step";
        const tooltipText = this.props.isAddOpStepDialog? 'Add a new step to the workflow' : 'Change the step parameters.';

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
                    {operationParamPanel}
                </div>
                <div className={Classes.DIALOG_FOOTER}>
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button onClick={this.handleCancel}>Cancel</Button>
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
}
