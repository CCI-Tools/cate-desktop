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
    static readonly DIALOG_ID = 'editOpStep';

    constructor(props: IEditOpStepDialogProps) {
        super(props);
        this.state = {isOpen: true};
        this.handleConfirm = this.handleConfirm.bind(this);
        this.handleCancel = this.handleCancel.bind(this);
    }

    private close(actionId: string) {
        this.setState(Object.assign({}, this.state, {isOpen: false}), () => {
            this.props.onClose(actionId, this.state);
        });
    }

    private handleConfirm() {
        this.close(EditOpStepDialog.DIALOG_ID);
    }

    private handleCancel() {
        this.close(null);
    }

    render() {

        const operationParamPanel = (<p>TODO...</p>); // TODO

        return (
            <Dialog
                isOpen={this.state.isOpen}
                iconName="folder-shared-open"
                onClose={this.handleCancel}
                title={this.props.isAddOpStepDialog ? "Add Operation Step" : "Change Operation Step Parameters"}
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
                        <Tooltip content={this.props.isAddOpStepDialog? 'Add a new operation step to the workflow' : 'Changes the operation step parameters.'} inline>
                            <Button className="pt-intent-primary" onClick={this.handleConfirm}>Open</Button>
                        </Tooltip>
                    </div>
                </div>
            </Dialog>
        );
    }
}
