import { HTMLSelect } from '@blueprintjs/core';
import * as React from 'react';
import { isDefinedAndNotNull } from '../../common/types';
import * as assert from '../../common/assert';

type ItemType = any | null;

export interface ISelectProps {
    value: ItemType;
    onChange: (value: ItemType) => void;
    values: ItemType[];
    labels?: string[] | JSX.Element[];
    nullable?: boolean;
    nullLabel?: string | JSX.Element;
    style?: { [name: string]: any };
}

export class Select extends React.PureComponent<ISelectProps, null> {
    static readonly NULL_ITEM_VALUE = '___NULL_ITEM_VALUE___';

    constructor(props: ISelectProps) {
        super(props);
        Select.checkProps(props);
        this.onChange = this.onChange.bind(this);
    }

    //noinspection JSMethodCanBeStatic
    componentWillReceiveProps(nextProps: ISelectProps): void {
        Select.checkProps(nextProps);
    }

    private static checkProps(props: ISelectProps) {
        assert.ok(props.values);
        if (isDefinedAndNotNull(props.labels)) {
            assert.ok(props.values.length === props.labels.length);
        }
    }

    private onChange(event: any) {
        const value = event.target.value;
        this.props.onChange(value === Select.NULL_ITEM_VALUE ? null : value);
    }

    render() {
        const itemValues = this.props.values;
        const itemLabels = this.props.labels;
        const nullable = this.props.nullable;

        const options = [];
        if (nullable) {
            options.push(<option key={-1} value={Select.NULL_ITEM_VALUE}>{this.props.nullLabel || ''}</option>);
        }
        for (let i = 0; i < itemValues.length; i++) {
            options.push(<option key={i} value={itemValues[i]}>{itemLabels ? itemLabels[i] : itemValues[i]}</option>);
        }

        const value = this.props.value || (nullable ? Select.NULL_ITEM_VALUE : '');
        return (
            <HTMLSelect
                value={value}
                onChange={this.onChange}
                disabled={itemValues.length === 0}
                style={this.props.style}
            >
                {options}
            </HTMLSelect>
        );
    }
}
