import * as React from 'react';
import {IExternalObjectComponentProps, ExternalObjectComponent} from '../ExternalObjectComponent'
import {MplFigure} from './MplFigure';


export interface FigureState {
}

interface IFigurePanelProps extends IExternalObjectComponentProps<MplFigure, FigureState>, FigureState {
    figureId: number;
    baseUrl: string;
    webSocket: WebSocket | null;
    onDownload: (figure: MplFigure, format: string) => void;
}

/**
 * A component that wraps a div that holds a matplotlib figure.
 *
 * @author Norman Fomferra
 */
export class MplFigurePanel extends ExternalObjectComponent<MplFigure, FigureState, IFigurePanelProps, null> {

    propsToExternalObjectState(props: IFigurePanelProps & FigureState): FigureState {
        return {};
    }

    newContainer(id: string): HTMLElement {
        const figureDiv = document.createElement("div");
        figureDiv.setAttribute("id", "mpl-figure-container-" + id);
        figureDiv.setAttribute("style", "width: 100%; height: 20em; padding: 1em; margin: 0.2em;");
        return figureDiv;
    }

    newExternalObject(parentContainer: HTMLElement, figureDiv: HTMLElement): MplFigure {
        const figure = new MplFigure(this.props.figureId,
            this.props.webSocket,
            this.props.onDownload,
            figureDiv);

        console.log("figure from mpl: ", figure);

        return figure;
    }

    updateExternalObject(object: MplFigure,
                         prevState: FigureState,
                         nextState: FigureState,
                         parentContainer: HTMLElement,
                         container: HTMLElement): void {
        // No changes expected
    }
}
