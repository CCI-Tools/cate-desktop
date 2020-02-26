import { FieldValue } from '../../components/field/Field';


export interface InputAssignment {
    constantValue: FieldValue<any> | any;
    resourceName: string;
    isValueUsed: boolean;
}

export type InputAssignments = { [inputName: string]: InputAssignment };
export type InputAssignmentMap = { [dialogId: string]: InputAssignments };

export function isInputAssigned(inputAssignments: InputAssignments, inputName: string): boolean {
    return !!inputAssignments[inputName];
}

export function assignConstantValueInput(inputAssignments: InputAssignments, inputName: string, constantValue: any): InputAssignments {
    return {...inputAssignments, [inputName]: {isValueUsed: true, constantValue, resourceName: null}};
}

export function assignResourceNameInput(inputAssignments: InputAssignments, inputName: string, resourceName: string): InputAssignments {
    return {...inputAssignments, [inputName]: {isValueUsed: false, constantValue: null, resourceName}};
}

