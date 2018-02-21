
export interface LogElementFactory<E> {
    createNewLineElement(): E;

    createSpanElement(): E;

    getSpanElementText(element: E): string;

    setSpanElementText(element: E, text: string);
}

/**
 * Used to convert incoming log messages (e.g. from a conda package installation) into an array
 * of (HTML) elements.
 */
export class LogProcessor<E> {
    private _elementFactory: LogElementFactory<E>;
    private _elements: E[];

    constructor(lineFactory: LogElementFactory<E>, elements?: E[]) {
        this._elementFactory = lineFactory;
        this._elements = elements || [];
    }

    get elements(): E[] {
        return this._elements;
    }

    processMessage(message: string) {
        if (this._elements.length === 0) {
            this._elements.push(this._elementFactory.createSpanElement());
        }
        const messageLines = message.replace("\r", "").split('\n');
        if (!LogProcessor.isEmptySplit(messageLines)) {
            this.updateLastElement(messageLines[0]);
            for (let i = 1; i < messageLines.length; i++) {
                this._elements.push(this._elementFactory.createNewLineElement());
                this._elements.push(this._elementFactory.createSpanElement());
                this.updateLastElement(messageLines[i]);
            }
        }
    }

    private updateLastElement(line: string) {
        const lineParts = line.split('\b');
        if (!LogProcessor.isEmptySplit(lineParts)) {
            let lastElement = this._elements[this._elements.length - 1];
            let text = this._elementFactory.getSpanElementText(lastElement);
            if (lineParts.length === 1) {
                text += lineParts[0];
            } else {
                text = lineParts[lineParts.length - 1];
            }
            this._elementFactory.setSpanElementText(lastElement, text);
        }
    }

    private static isEmptySplit(parts) {
        return parts.length === 0 || parts.length === 1 && parts[0] === "";
    }
}
