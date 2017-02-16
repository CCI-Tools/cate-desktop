import * as React from 'react'

// TODO (forman): add splitter width, color, handleIcon, etc. style props
interface ISplitterProps {
    direction?: "hor" | "ver";
    onChange: (delta: number) => any;
}

interface IButtonEvent {
    button: number;
    buttons: number;
}

interface IScreenEvent {
    screenX: number;
    screenY: number;
}

type EventListenerItem = [string, (any) => any];


/**
 * A splitter component.
 * In order to work properly, clients must provide the onChange which is a callback that receives the delta position
 * either in x-direction if direction is "hor" or y-direction if direction is "ver". The callback must then
 * adjust either a container's width if direction is "hor" or its height if direction is "ver".
 *
 * @author Norman Fomferra
 */
export class Splitter extends React.PureComponent<ISplitterProps, any> {
    private lastPosition: null | number = null;
    private bodyEventListeners: Array<EventListenerItem>;

    constructor(props: ISplitterProps) {
        super(props);
        if (!props.onChange) {
            throw Error('onChange property must be provided');
        }
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
            this.props.onChange(positionDelta);
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
        return this.props.direction === 'hor' ? event.screenX : event.screenY;
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
        const className = this.props.direction === 'hor' ? 'cate-splitter-hor' : 'cate-splitter-ver';
        return (
            <div
                className={className}
                onMouseDown={this.onMouseDown.bind(this)}
            />
        );
    }
}


