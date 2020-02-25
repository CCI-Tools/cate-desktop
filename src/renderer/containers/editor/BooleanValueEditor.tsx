import * as React from 'react';
import {IValueEditorProps} from "./ValueEditor";
import {Checkbox} from "@blueprintjs/core";

export function BooleanValueEditor(props: IValueEditorProps<boolean>) {
    return (
        <Checkbox className="bp3-large"
                  checked={(props.value as any) || false}
                  indeterminate={props.value === null}
                  onChange={(event: any) => props.onChange(props.input, event.target.checked)}/>
    );
}
