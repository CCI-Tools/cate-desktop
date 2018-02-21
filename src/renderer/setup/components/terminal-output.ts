export interface TerminalElementType<E> {
    createLineBreakElement(): E;

    createLineElement(): E;

    getLineElementText(element: E): string;

    setLineElementText(element: E, text: string);
}

export type TextElement = [string];

export class TextElementType implements TerminalElementType<TextElement> {

    createLineBreakElement(): TextElement {
        return ["\n"];
    }

    createLineElement(): TextElement {
        return [""];
    }

    getLineElementText(element: TextElement): string {
        return element[0];
    }

    setLineElementText(element: TextElement, text: string) {
        element[0] = text;
    }
}

export function unwrapTextElements(elements: TextElement[]): string[] {
    return elements.map(e => e[0]);
}

/**
 * Used to convert incoming terminal output messages (e.g. from a conda package installation) that contain ASCII
 * control characters into an array of (HTML) elements.
 */
export function parseTerminalOutput<E>(output: string, elementType: TerminalElementType<E>, elements?: E[]): E[] {
    if (!elements || elements.length === 0) {
        elements = [elementType.createLineElement()];
    }
    const messageLines = output.split('\n');
    if (messageLines && messageLines.length !== 0) { // should always be true
        elements = elements.slice();
        updateLastLineElement(messageLines[0], elementType, elements);
        for (let i = 1; i < messageLines.length; i++) {
            elements.push(elementType.createLineBreakElement());
            elements.push(elementType.createLineElement());
            updateLastLineElement(messageLines[i], elementType, elements);
        }
    }
    return elements;
}

function updateLastLineElement<E>(line: string, elementType: TerminalElementType<E>, elements?: E[]) {
    const lineParts = line.split('\r');
    if (lineParts && lineParts.length !== 0) { // should always be true
        let element = elements[elements.length - 1];
        let text = elementType.getLineElementText(element);
        for (let linePart of lineParts) {
            if (text.length > linePart.length) {
                text = linePart + text.substr(linePart.length);
            } else {
                text = linePart;
            }
        }
        elementType.setLineElementText(element, text);
    }
}
