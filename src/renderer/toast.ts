import {IActionProps, ILinkProps, Intent, Position, Toaster} from "@blueprintjs/core";
import {MessageState} from "./state";

let MessageToaster = null;

export function showToast(message: MessageState) {

    if (!MessageToaster) {
        MessageToaster = Toaster.create({
            className: "cate-toaster",
            position: Position.BOTTOM,
        });
    }

    let iconName;
    let intent;
    if (message.type === 'info') {
        iconName = 'info-sign';
        intent = Intent.NONE;
    } else if (message.type === 'success') {
        iconName = 'tick';
        intent = Intent.SUCCESS;
    } else if (message.type === 'notification') {
        iconName = 'notifications';
        intent = Intent.PRIMARY;
    } else if (message.type === 'warning') {
        iconName = 'warning-sign';
        intent = Intent.WARNING;
    } else if (message.type === 'error') {
        iconName = 'error';
        intent = Intent.DANGER;
    }

    let action: IActionProps & ILinkProps;
    if (message.action) {
        action = {
            onClick: message.action.onClick,
            text: message.action.text,
            iconName: message.action.iconName,
            href: message.action.href,
            target: message.action.href ? '_blank' : undefined,
        }
    }

    MessageToaster.show({
        message: message.text,
        iconName,
        intent,
        action,
    });
}
