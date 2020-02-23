import * as React from 'react';
import { AnchorButton, Intent } from "@blueprintjs/core";
import { IValueEditorProps, ValueEditorCallback, ValueEditorValue } from "./ValueEditor";
import * as actions from "../../actions";
import { OperationInputState } from "../../state";
import { TextField } from "../../components/field/TextField";

interface IFileValueEditorProps extends IValueEditorProps<string> {
}

// TODO (forman): complete me, i.e. validate file name

export class FileValueEditor extends React.PureComponent<IFileValueEditorProps, null> {

    private static DIV_STYLE = {width: '20em', display: 'flex'};
    private static TEXT_FIELD_STYLE = {flexGrow: 1};
    private static BUTTON_STYLE = {flex: 'none'};

    render() {
        const input = this.props.input;
        const value = (this.props.value as any) || '';
        const onChange = this.props.onChange;

        let showFileDialogCallback;
        if (this.props.input.fileOpenMode === 'w') {
            showFileDialogCallback = FileValueEditor.showSaveDialog;
        } else {
            showFileDialogCallback = FileValueEditor.showOpenDialog;
        }

        return (
            <div className="pt-control-group" style={FileValueEditor.DIV_STYLE}>
                <TextField style={FileValueEditor.TEXT_FIELD_STYLE}
                           value={value}
                           placeholder="Enter local file path"
                           onChange={value => onChange(input, value)}
                           nullable={this.props.input.nullable}
                />
                <AnchorButton intent={Intent.PRIMARY} style={FileValueEditor.BUTTON_STYLE}
                              onClick={() => showFileDialogCallback(input, value, onChange)}>...</AnchorButton>
            </div>
        );
    }

    static showOpenDialog(input: OperationInputState,
                          value: ValueEditorValue<string>,
                          onChange: ValueEditorCallback<string>) {
        const openDialogOptions = {
            title: "Open File",
            defaultPath: value as string,
            buttonLabel: "Open",
            filters: input.fileFilters,
            properties: input.fileProps as any,
        };
        actions.showSingleFileOpenDialog(openDialogOptions, (filePath: string) => {
            if (filePath) {
                onChange(input, filePath);
            }
        });
    }

    static showSaveDialog(input: OperationInputState,
                          value: ValueEditorValue<string>,
                          onChange: ValueEditorCallback<string>) {
        const saveDialogOptions = {
            title: "Save File",
            defaultPath: value as string,
            buttonLabel: "Save",
            filters: input.fileFilters,
        };
        actions.showFileSaveDialog(saveDialogOptions, (filePath: string) => {
            if (filePath) {
                onChange(input, filePath);
            }
        });
    }
}
