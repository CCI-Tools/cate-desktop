import * as React from 'react'
import {Splitter} from "./Splitter";


export interface ISplitPaneProps {
    dir: "hor" | "ver";
    initialSize?: number;
    onChange?: (newSize: number, oldSize: number) => void;
}

export interface ISplitPaneState {
    size: number;
}

/**
 * A simple SplitPane component which must have exactly two child elements.
 *
 * Properties:
 * - direction: the split direction, either "hor" or "ver"
 * - initialSize: the initial width ("hor") or height ("ver") of the first child's container
 *
 * @author Norman Fomferra
 */
export class SplitPane extends React.PureComponent<ISplitPaneProps, ISplitPaneState> {

    constructor(props: ISplitPaneProps) {
        super(props);
        this.state = {
            size: props.initialSize,
        };
    }

    private handleSplitDelta(delta: number) {
        this.setState((state: ISplitPaneState, props: ISplitPaneProps) => {
            const oldSize = state.size;
            const newSize = oldSize + delta;
            if (this.props.onChange) {
                this.props.onChange(newSize, oldSize);
            }
            return {
                size: newSize,
            };
        });
    }

    render() {
        let containerClass;
        let childContainer1Style;
        let childContainer2Style;
        if (this.props.dir === 'hor') {
            containerClass = 'cate-split-pane-hor';
            childContainer1Style = {flex: 'none', width: this.state.size, height: '100%'};
            childContainer2Style = {flex: 'auto', width: '100%', height: '100%'};
        } else {
            containerClass = 'cate-split-pane-ver';
            childContainer1Style = {flex: 'none', width: '100%', height: this.state.size};
            childContainer2Style = {flex: 'auto', width: '100%', height: '100%'};
        }
        return (
            <div className={containerClass}>
                <div style={childContainer1Style}>
                    {this.props.children[0]}
                </div>
                <Splitter dir={this.props.dir} onChange={this.handleSplitDelta.bind(this)}/>
                <div style={childContainer2Style}>
                    {this.props.children[1]}
                </div>
            </div>
        );
    }
}

