import * as React from 'react';
import {IExternalObjectComponentProps, ExternalObjectComponent} from '../ExternalObjectComponent'
import {MplFigure, MplFigureCommandSource, MplFigureMessageCallback} from './MplFigure';


export interface FigureState {
}

interface IFigureContainerProps extends IExternalObjectComponentProps<MplFigure, FigureState>, FigureState {
    figureId: number;
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

    propsToExternalObjectState(props: IFigureContainerProps & FigureState): FigureState {
        return {};
    }

    newContainer(id: string): HTMLDivElement {
        const figureDiv = document.createElement("div");
        figureDiv.setAttribute("id", "mpl-figure-container-" + id);
        figureDiv.setAttribute("style", "width: 100%; position: relative;");
        if (this.props.figureHeight) {
            figureDiv.style.height = this.props.figureHeight;
        }
        console.log("MplFigureContainer.newContainer:", figureDiv);
        return figureDiv;
    }

    newExternalObject(parentContainer: HTMLElement, figureDiv: HTMLDivElement): MplFigure {
        return new MplFigure(this.props.figureId,
                             this.props.webSocketUrl,
                             figureDiv,
                             this.props.commandSource,
                             this.props.onMessage);
    }

    externalObjectMounted(figure: MplFigure, parentContainer: HTMLElement, container: HTMLElement): void {
        console.log("MplFigureContainer.externalObjectMounted:", figure, parentContainer, container);
        figure.onMount();
    }

    externalObjectUnmounted(figure: MplFigure, parentContainer: HTMLElement, container: HTMLElement): void {
        console.log("MplFigureContainer.externalObjectUnmounted:", figure, parentContainer, container);
        figure.onUnmount();
    }


    updateExternalObject(object: MplFigure,
                         prevState: FigureState,
                         nextState: FigureState,
                         parentContainer: HTMLElement,
                         container: HTMLElement): void {
        // No changes expected
    }
}
