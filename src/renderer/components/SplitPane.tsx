import * as React from 'react'
import {Splitter, SplitDir} from "./Splitter";


export interface ISplitPaneProps {
    dir: SplitDir;
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
 * - dir: the split direction, either "hor" or "ver"
 * - initialSize: the initial width ("hor") or height ("ver") of the first child's container
 *
 * @author Norman Fomferra
 */
export class SplitPane extends React.PureComponent<ISplitPaneProps, ISplitPaneState> {

    constructor(props: ISplitPaneProps) {
        super(props);
        this.handleSplitDelta = this.handleSplitDelta.bind(this);
        this.state = { size: props.initialSize };
    }

    private handleSplitDelta(delta: number) {
        this.setState((state: ISplitPaneState) => {
            const oldSize = state.size;
            const newSize = oldSize + delta;
            if (this.props.onChange) {
                this.props.onChange(newSize, oldSize);
            }
            return {size: newSize};
        });
    }

    render() {
        let containerClass;
        let childContainer1Style;
        let childContainer2Style;
        const splitterSize = 4; // px
        if (this.props.dir === 'hor') {
            const width1 = this.state.size;
            const width2 = `calc(100% - ${width1 + splitterSize}px)`;
            containerClass = 'cate-split-pane-hor';
            childContainer1Style = {flex: 'none', width: width1, height: '100%'};
            childContainer2Style = {flex: 'auto', width: width2, height: '100%'};
        } else {
            const height1 = this.state.size;
            const height2 = `calc(100% - ${height1 + splitterSize}px)`;
            containerClass = 'cate-split-pane-ver';
            childContainer1Style = {flex: 'none', width: '100%', height: height1};
            childContainer2Style = {flex: 'auto', width: '100%', height: height2};
        }
        return (
            <div className={containerClass}>
                <div style={childContainer1Style}>
                    {this.props.children[0]}
                </div>
                <Splitter dir={this.props.dir} onChange={this.handleSplitDelta}/>
                <div style={childContainer2Style}>
                    {this.props.children[1]}
                </div>
            </div>
        );
    }
}

