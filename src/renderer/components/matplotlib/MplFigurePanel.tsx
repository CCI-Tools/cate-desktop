import * as React from 'react';
import {IExternalObjectComponentProps, ExternalObjectComponent} from '../ExternalObjectComponent'

/**
 * Follows the figure class definition in mpl.js
 */
export interface Figure {
    id: number;
    ws: WebSocket;
    supports_binary: boolean;
    imageObj: any; // Image;
}

export interface FigureState {
}

interface IFigurePanelProps extends IExternalObjectComponentProps<Figure, FigureState>, FigureState {
    figureId: number;
    baseUrl: string;
    webSocket: WebSocket | null;
    onDownload: (figure: Figure, format: string) => void;
    mpl: any;
}

/**
 * A component that wraps a div that holds a matplotlib figure.
 *
 * @author Norman Fomferra
 */
export class MplFigurePanel extends ExternalObjectComponent<Figure, FigureState, IFigurePanelProps, null> {

    propsToExternalObjectState(props: IFigurePanelProps & FigureState): FigureState {
        return {};
    }

    newContainer(id: string): HTMLElement {
        const figureDiv = document.createElement("div");
        figureDiv.setAttribute("id", "mpl-figure-container-" + id);
        figureDiv.setAttribute("style", "width: 100%; height: 20em; padding: 1em; margin: 0.2em;");
        return figureDiv;
    }

    newExternalObject(parentContainer: HTMLElement, figureDiv: HTMLElement): Figure {
        let mpl = this.props.mpl;
        if (!mpl) {
            throw Error("Matplotlib module 'mpl' is not defined");
        }

        const figure = new mpl.figure(this.props.figureId,
            this.props.webSocket,
            this.props.onDownload,
            figureDiv);

        console.log("figure from mpl: ", figure);

        return figure;
    }

    updateExternalObject(object: Figure,
                         prevState: FigureState,
                         nextState: FigureState,
                         parentContainer: HTMLElement,
                         container: HTMLElement): void {
        // No changes expected
    }
}
