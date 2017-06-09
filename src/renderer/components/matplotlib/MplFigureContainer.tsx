import * as React from 'react';
import {IExternalObjectComponentProps, ExternalObjectComponent} from '../ExternalObjectComponent'
import {MplFigure, MplFigureCommandSource} from './MplFigure';


export interface FigureState {
}

interface IFigureContainerProps extends IExternalObjectComponentProps<MplFigure, FigureState>, FigureState {
    figureId: number;
    webSocketUrl: string;
    commandSource?: MplFigureCommandSource;
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

    newContainer(id: string): HTMLElement {
        const figureDiv = document.createElement("div");
        figureDiv.setAttribute("id", "mpl-figure-container-" + id);
        figureDiv.setAttribute("style", "width: 100%; height: 20em; padding: 1em; margin: 0.2em;");
        return figureDiv;
    }

    newExternalObject(parentContainer: HTMLElement, figureDiv: HTMLElement): MplFigure {
        return new MplFigure(this.props.figureId, this.props.webSocketUrl, figureDiv, this.props.commandSource);
    }

    updateExternalObject(object: MplFigure,
                         prevState: FigureState,
                         nextState: FigureState,
                         parentContainer: HTMLElement,
                         container: HTMLElement): void {
        // No changes expected
    }
}
