import * as React from 'react';
import {IValueEditorProps, ValueEditorCallback, ValueEditorValue} from "./ValueEditor";
import {AnchorButton} from "@blueprintjs/core";
import * as actions from "../../actions";
import {OperationInputState} from "../../state";
import {TextField} from "../../components/field/TextField";

interface IFileValueEditorProps extends IValueEditorProps<string> {
}

// TODO (forman): complete me, i.e. validate file name

export class FileValueEditor extends React.PureComponent<IFileValueEditorProps, null> {
    render() {
        const input = this.props.input;
        const value = (this.props.value as any) || '';
        const onChange = this.props.onChange;

        let showFileDialogCallback;
        if (this.props.input.fileOpenMode === 'r') {
            showFileDialogCallback = FileValueEditor.showOpenDialog;
        } else {
            showFileDialogCallback = FileValueEditor.showSaveDialog;
        }

        return (
            <div className="pt-control-group" style={{width: '20em', display: 'flex'}}>
                <TextField style={{flexGrow: 1}}
                           value={value}
                           placeholder="Enter local file path"
                           onChange={value => onChange(input, value)}
                />
                <AnchorButton className="pt-intent-primary" style={{flex: 'none'}}
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
