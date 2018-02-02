import * as React from 'react';
import {IExternalObjectComponentProps, ExternalObjectComponent} from '../ExternalObjectComponent'
import {MplFigure, MplFigureCommandSource, MplFigureMessageCallback} from './MplFigure';


export interface FigureState {
    figureUpdateCount: number;
}

interface IFigureContainerProps extends IExternalObjectComponentProps<MplFigure, FigureState>, FigureState {
    figureId: number;
    figureUpdateCount: number;
    figureHeight?: any;
    webSocketUrl: string;
    commandSource?: MplFigureCommandSource;
    onMessage?: MplFigureMessageCallback;
}

/**
 * A component that wraps a div that holds a matplotlib figure.
 *
 * @author Norman Fomferra
 */
export class MplFigureContainer extends ExternalObjectComponent<MplFigure, FigureState, IFigureContainerProps, null> {

    propsToExternalObjectState(props: IFigureContainerProps & FigureState, prevState?: FigureState): FigureState {
        return {figureUpdateCount: props.figureUpdateCount};
    }

    newContainer(id: string): HTMLDivElement {
        const figureDiv = document.createElement("div");
        figureDiv.setAttribute("id", "mpl-figure-container-" + id);
        figureDiv.setAttribute("style", "width: 100%; position: relative;");
        if (this.props.figureHeight) {
            figureDiv.style.height = this.props.figureHeight;
        }
        if (this.props.debug) {
            console.log("MplFigureContainer.newContainer:", figureDiv);
        }
        return figureDiv;
    }

    newExternalObject(parentContainer: HTMLElement, figureDiv: HTMLDivElement): MplFigure {
        return new MplFigure(this.props.figureId,
                             this.props.webSocketUrl,
                             figureDiv,
                             this.props.commandSource,
                             this.props.onMessage);
    }

    updateExternalObject(figure: MplFigure,
                         prevState: FigureState,
                         nextState: FigureState,
                         parentContainer: HTMLElement,
                         container: HTMLElement): void {
        if (this.props.debug) {
            console.log("MplFigureContainer.updateExternalObject: ", figure, prevState, nextState);
        }
        if (prevState && prevState.figureUpdateCount !== nextState.figureUpdateCount) {
            figure.sendRefresh();
            figure.sendResize();
        }
    }
}
