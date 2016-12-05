import * as React from 'react'
import './ListBox.css'

export interface IListBoxProps {
    numItems: number;
    renderItem: (itemIndex: number) => JSX.Element;
    getItemKey?: (itemIndex: number) => React.Key;
    onItemClick?: (key: React.Key, itemIndex: number) => void;
    onItemDoubleClick?: (key: React.Key, itemIndex: number) => void;
    onSelectionChange?: (oldSelection: Array<React.Key>, newSelection: Array<React.Key>) => void;
    multiSelect: boolean;
    selection: Array<React.Key>;
    style?: Object;
    itemStyle?: Object;
}

export class ListBox extends React.Component<IListBoxProps, any> {
    constructor(props: IListBoxProps) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
    }

    handleClick(itemIndex, key: string|number) {
        if (this.props.onSelectionChange) {
            let newSelection;
            if (this.props.selection) {
                newSelection = this.props.selection.slice();
                const itemIndex = this.props.selection.findIndex(k => k === key);
                if (itemIndex >= 0) {
                    delete newSelection[itemIndex];
                } else {
                    newSelection.push(key);
                }
            } else {
                newSelection = [key];
            }
            this.props.onSelectionChange(this.props.selection, newSelection);
        }
        if (this.props.onItemClick) {
            this.props.onItemClick(key, itemIndex);
        }
    }

    handleDoubleClick(itemIndex, key: string|number) {
        if (this.props.onItemDoubleClick) {
            this.props.onItemDoubleClick(key, itemIndex);
        }
    }

    render() {
        // see http://www.w3schools.com/css/tryit.asp?filename=trycss_list-style-border
        const border = '1px solid #ddd';
        const listStyle = Object.assign({
            listStyleType: 'none',
            padding: 0,
            border
        }, this.props.style || {});
        const normalItemStyle = Object.assign({
            padding: '0.4em',
            borderBottom: border,
        }, this.props.itemStyle || {});
        const selectedItemStyle = Object.assign({}, normalItemStyle, {});

        const selection = new Set<any>(this.props.selection || []);
        const getItemKey = this.props.getItemKey || (itemIndex => itemIndex);
        const renderItem = this.props.renderItem;
        let items: Array<JSX.Element> = [];
        for (let itemIndex = 0; itemIndex < this.props.numItems; itemIndex++) {
            const key = getItemKey(itemIndex);
            const item = renderItem(itemIndex);
            const itemStyle = selection.has(key) ? selectedItemStyle : normalItemStyle;
            items.push(
                <li key={key}
                    onClick={() => this.handleClick(itemIndex, key)}
                    onDoubleClick={() => this.handleDoubleClick(itemIndex, key)}
                    style={itemStyle}>
                    {item}
                </li>
            );
        }

        return (
            <ul style={listStyle}>
                {items}
            </ul>
        );
    }
}

