import * as React from 'react';
import { Button, Classes, ControlGroup, InputGroup, Label, Tooltip } from '@blueprintjs/core';

export interface IPathFieldProps {
    label: string;
    value: string;
    onChange: (event: any) => any;
    onBrowse: (event: any) => any;
    placeholder?: string;
    validation?: string | null;
}

export function PathField(props: IPathFieldProps) {
    let className;

    if (props.validation) {
        className = Classes.INTENT_DANGER;
    } else {
        className = '';
    }

    let pathField = (
        <Label>
            {props.label}
            <ControlGroup>
                <InputGroup
                    type="text"
                    fill={true}
                    className={className}
                    placeholder={props.placeholder}
                    value={props.value}
                    onChange={props.onChange}
                />
                <Button text="Browse..." onClick={props.onBrowse}/>
            </ControlGroup>
        </Label>
    );


    if (props.validation) {
        pathField = (
            <div>
                {pathField}
                <span style={{fontSize: '0.8em', color: '#A82A2A'}}>{props.validation}</span>
            </div>
        );
    }

    return pathField;
}
