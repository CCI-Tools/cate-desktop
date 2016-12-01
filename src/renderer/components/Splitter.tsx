import * as React from 'react'

interface ISplitterProps {
    splitType: "col" | "row";
    onPositionChange: (delta: number) => any;
}

interface IButtonEvent {
    button: number;
    buttons: number;
}

interface IScreenEvent {
    screenX: number;
    screenY : number;
}

type EventListenerItem = [string, (any) => any];

// TODO: add splitter width, color, etc. style props

/**
 * A splitter component.
 *
 * @author Norman Fomferra
 */
export class Splitter extends React.Component<ISplitterProps, any> {
    private lastPosition: null | number = null;
    private bodyEventListeners: Array<EventListenerItem>;

    constructor(props: ISplitterProps) {
        super(props);
        this.bodyEventListeners = [
            ['mousemove', this.onBodyMouseMove.bind(this)],
            ['mouseup', this.onBodyMouseUp.bind(this)],
            ['onmouseenter', this.onBodyMouseEnter.bind(this)],
            ['onmouseleave', this.onBodyMouseLeave.bind(this)],
        ];
    }

    private onMouseDown(event: React.MouseEvent<HTMLDivElement>) {
        if (this.isButton1Pressed(event)) {
            this.lastPosition = this.getCurrentPosition(event);
            this.removeBodyMouseListeners();
            this.addBodyMouseListeners();
        } else {
            this.lastPosition = null;
        }
    }

    private onBodyMouseMove(event: MouseEvent) {
        if (this.lastPosition === null || !this.isButton1Pressed(event)) {
            return;
        }
        const currentPosition = this.getCurrentPosition(event);
        const positionDelta = currentPosition - this.lastPosition;
        this.lastPosition = currentPosition;
        if (positionDelta != 0) {
            this.props.onPositionChange(positionDelta);
        }
    }

    //noinspection JSUnusedLocalSymbols
    private onBodyMouseUp(event: MouseEvent) {
        // console.log("onBodyMouseUp: ", event, this);
        this.endDragging();
    }

    //noinspection JSUnusedLocalSymbols
    private onBodyMouseEnter(event: MouseEvent) {
        // console.log("onBodyMouseEnter: ", event, this);
        this.endDragging();
    }

    //noinspection JSUnusedLocalSymbols
    private onBodyMouseLeave(event: MouseEvent) {
        // console.log("onBodyMouseLeave: ", event, this);
        this.endDragging();
    }

    //noinspection JSMethodCanBeStatic
    private isButton1Pressed(event: IButtonEvent) {
        return event.button === 0 && event.buttons === 1;
    }

    private getCurrentPosition(event: IScreenEvent) {
        return this.props.splitType === 'row' ? event.screenY : event.screenX;
    }

    private endDragging() {
        this.removeBodyMouseListeners();
        this.lastPosition = null;
    }

    private addBodyMouseListeners() {
        this.bodyEventListeners.forEach((pair: EventListenerItem) =>
            document.body.addEventListener(pair[0], pair[1]));
    }

    private removeBodyMouseListeners() {
        this.bodyEventListeners.forEach((pair: EventListenerItem) =>
            document.body.removeEventListener(pair[0], pair[1]));
    }

    componentWillUnmount() {
        this.removeBodyMouseListeners();
    }

    render() {
        const className = this.props.splitType === 'row' ? 'cate-row-splitter' : 'cate-col-splitter';
        return (
            <div
                className={className}
                onMouseDown={this.onMouseDown.bind(this)}
            />
        );
    }
}


