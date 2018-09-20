import * as React from 'react'
//import './ListBox.css'

export enum ListBoxSelectionMode {
    SINGLE,
    MULTIPLE
}


export interface IListBoxProps {
    key?: string | number;
    items: any[];
    renderItem: (item: any, itemIndex: number) => JSX.Element;
    getItemKey?: (item: any, itemIndex: number) => React.Key;
    onItemClick?: (item: any, itemIndex: number) => void;
    onItemDoubleClick?: (item: any, itemIndex: number) => void;
    onSelection?: (newSelection: React.Key[], oldSelection: React.Key[]) => void;
    selectionMode?: ListBoxSelectionMode;
    selection?: React.Key[]|React.Key|null;
    style?: Object;
    itemStyle?: Object;
}

/**
 * A  ListBox is used similar to Blueprint's `Table` component.
 *
 * @author Norman Fomferra
 */
export class ListBox extends React.PureComponent<IListBoxProps, any> {
    constructor(props: IListBoxProps) {
        super(props);
    }

    handleClick(event: MouseEvent, itemIndex, key: string|number) {
        // console.log('handleClick', event.button, event.buttons,event.bubbles, event.detail);
        if (event.detail === 2) {
            return;
        }
        if (this.props.onSelection) {
            const oldSelection = toSelectionArray(this.props.selection);
            let newSelection;
            if (this.props.selection) {
                const selectionMode = this.props.selectionMode || ListBoxSelectionMode.SINGLE;
                const itemIndex = oldSelection.findIndex(k => k === key);
                if (itemIndex >= 0) {
                    newSelection = oldSelection.slice();
                    newSelection.splice(itemIndex, 1);
                } else {
                    if (selectionMode === ListBoxSelectionMode.SINGLE) {
                        newSelection = [key];
                    } else if (selectionMode === ListBoxSelectionMode.MULTIPLE) {
                        newSelection = oldSelection.slice();
                        newSelection.push(key);
                    }
                }
            } else {
                newSelection = [key];
            }
            this.props.onSelection(newSelection, oldSelection);
        }
        if (this.props.onItemClick) {
            this.props.onItemClick(this.props.items[itemIndex], itemIndex);
        }
    }

    handleDoubleClick(event, itemIndex) {
        // console.log('handleDoubleClick', event.button, event.buttons,event.bubbles, event.detail);
        if (this.props.onItemDoubleClick) {
            this.props.onItemDoubleClick(this.props.items[itemIndex], itemIndex);
        }
    }

    render() {
        const items = this.props.items;
        if (!items) {
            return null;
        }

        // see http://www.w3schools.com/css/tryit.asp?filename=trycss_list-style-border
        // const border = '1px solid #ddd';
        const listStyle = Object.assign({
            //listStyleType: 'none',
            //padding: 0,
            //border
        }, this.props.style || {});
        const normalItemStyle = Object.assign({
            //padding: '0.4em',
            //borderBottom: border,
        }, this.props.itemStyle || {});
        const selectedItemStyle = Object.assign({}, normalItemStyle, {});

        const selection = new Set<any>(toSelectionArray(this.props.selection));
        const getItemKey = this.props.getItemKey || ((item: any, itemIndex: number) => itemIndex);
        const renderItem = this.props.renderItem;
        //noinspection JSMismatchedCollectionQueryUpdate
        let renderedItems: Array<JSX.Element> = [];
        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            const item = items[itemIndex];
            const key = getItemKey(item, itemIndex);
            const renderedItem = renderItem(item, itemIndex);
            const selected = selection.has(key);
            const itemStyle = selected ? selectedItemStyle : normalItemStyle;
            const className = selected ? 'cate-selected' : null;
            renderedItems.push(
                <li key={key}
                    onClick={(event) => this.handleClick(event as any, itemIndex, key)}
                    onDoubleClick={(event) => this.handleDoubleClick(event as any, itemIndex)}
                    className={className}
                    style={itemStyle}>
                    {renderedItem}
                </li>
            );
        }

        return (
            <ul key={this.props.key} className="cate-list-box" style={listStyle}>
                {renderedItems}
            </ul>
        );
    }
}

const EMPTY_ARRAY = [];

function toSelectionArray(obj): any[] {
    if (obj === null || typeof obj === 'undefined') {
        return EMPTY_ARRAY;
    }
    if (obj.constructor === Array) {
        return obj;
    }
    return [obj];
}
