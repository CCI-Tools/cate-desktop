
export interface TransactionProgress {
    name?: string;
    message?: string;
    worked?: number;
    totalWork?: number;
    subWorked?: number;
    done?: boolean;
    stdout?: string;
    stderr?: string;
    error?: Error;
}

export type TransactionProgressHandler = (progress: TransactionProgress) => any;

export type TransactionState = { [key: string]: any };

export interface TransactionContext {
    getTransactionState(transactionId: string): TransactionState;

    getTransaction(transactionId: string): Transaction;
}

/**
 * Simple transaction, that
 *
 * 1. can check if it is already fulfilled
 * 2. can fulfil itself
 * 3. can rollback itself
 *
 * All operations return promises, so they may be implemented asynchronously.
 */
export class Transaction {
    readonly id: string;
    readonly requires: string[];
    readonly name: string;

    constructor(id: string, requires?: string[], name?: string) {
        this.id = id;
        this.requires = requires || [];
        this.name = name || id;
    }

    // noinspection JSMethodCanBeStatic
    newInitialState(context: TransactionContext): TransactionState {
        return {};
    }

    getState(context: TransactionContext): TransactionState {
        return context.getTransactionState(this.id);
    }

    /**
     * Ensures that this transaction is fulfilled by returning a promise
     * @param {TransactionContext} context
     * @param {TransactionProgressHandler} onProgress
     * @returns {Promise<any>}
     */
    ensureFulfilled(context: TransactionContext, onProgress: TransactionProgressHandler): Promise<any> {
        return this.fulfilled(context, onProgress).then(isFulfilled => {
            if (!isFulfilled) {
                //console.log(`"${this.name}" is not fulfilled`);
                return this.fulfill(context, onProgress);
            } else {
                //console.log(`"${this.name}" is already fulfilled`);
                // return undefined;
            }
        });
    }

    // noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
    /**
     * Check if this transaction is already fulfilled.
     * The default implementation returns a promise that resolves to false.
     *
     * @param {TransactionContext} context
     * @param {TransactionProgressHandler} onProgress
     * @returns {Promise<boolean>}
     */
    fulfilled(context: TransactionContext, onProgress: TransactionProgressHandler): Promise<boolean> {
        return Promise.resolve(false);
    };

    // noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
    /**
     * Fulfills the transaction.
     * The default implementation does nothing.
     *
     * @param {TransactionContext} context
     * @param {TransactionProgressHandler} onProgress
     * @returns {Promise<any>}
     */
    fulfill(context: TransactionContext, onProgress: TransactionProgressHandler): Promise<any> {
        return Promise.resolve();
    }

    // noinspection JSMethodCanBeStatic,JSUnusedLocalSymbols
    /**
     * Rolls back the transaction.
     * The default implementation does nothing.
     *
     * @param {TransactionContext} context
     * @param {TransactionProgressHandler} onProgress
     * @returns {Promise<any>}
     */
    rollback(context: TransactionContext, onProgress: TransactionProgressHandler): Promise<any> {
        return Promise.resolve();
    }
}

export class TransactionError extends Error {
    readonly transaction: Transaction;
    readonly index: number;
    readonly reason: Error;

    constructor(transaction: Transaction, index: number, reason: any) {
        super(`failed to fulfill transaction "${transaction.name}"`);
        this.transaction = transaction;
        this.index = index;
        this.reason = reason;
    }
}


export class TransactionSet implements TransactionContext {
    // noinspection JSUnusedLocalSymbols
    private static NO_PROGRESS_HANDLER: TransactionProgressHandler = (progress: TransactionProgress) => null;

    private _transactions: { [id: string]: Transaction };
    private _transactionStates: { [id: string]: TransactionState };

    constructor(transactions?: Transaction[]) {
        this._transactions = {};
        this._transactionStates = {};
        if (transactions) {
            this.addTransactions(transactions);
        }
    }

    getTransactionIds(): string[] {
        return Object.getOwnPropertyNames(this._transactions);
    }

    getTransactionState(transactionId: string): TransactionState {
        let state = this._transactionStates[transactionId];
        if (!state) {
            let transaction = this.getTransaction(transactionId);
            state = transaction.newInitialState(this);
            this._transactionStates[transactionId] = state;
        }
        return state;
    }

    getTransaction(transactionId: string): Transaction {
        const transaction = this._transactions[transactionId];
        if (!transaction) {
            throw new Error(`unknown transaction ID: "${transactionId}"`);
        }
        return transaction;
    }

    addTransaction(transaction: Transaction) {
        const oldTransaction = this._transactions[transaction.id];
        if (oldTransaction && oldTransaction !== transaction) {
            throw new Error(`transaction with ID "${transaction.id}" already exists`);
        }
        this._transactions[transaction.id] = transaction;
    }

    addTransactions(transactions: Transaction[]) {
        for (let transaction of transactions) {
            this.addTransaction(transaction);
        }
    }

    collectTransactions(transactionId: string): Transaction[] {
        const transaction = this.getTransaction(transactionId);
        const collectedTransactions = [];
        this._collectTransactions(transaction, collectedTransactions);
        return collectedTransactions;
    }

    fulfillTransaction(transactionId: string, onProgress?: TransactionProgressHandler): Promise<any> {
        onProgress = onProgress || TransactionSet.NO_PROGRESS_HANDLER;
        this._transactionStates = {};
        const transactions = this.collectTransactions(transactionId);
        const fulfillSequence = this.newFulfillSequence(transactions, onProgress);
        return fulfillSequence.catch(reason => {
            if (!(reason instanceof TransactionError)) {
                throw reason;
            }
            let rollbackSequence = this.newRollbackSequence(transactions, reason, onProgress);
            // Now force the rollbackSequence to fail.
            return rollbackSequence.then(() => Promise.reject(reason));
        });
    }

    private newFulfillSequence(transactions: Transaction[], onProgress: TransactionProgressHandler) {
        onProgress({worked: 0, totalWork: transactions.length, subWorked: 0, done: transactions.length === 0});
        let ensureFulfilledReducer = (p: Promise<void>, t: Transaction, i: number) => {
            //console.log(`adding ${r.name}`);
            return p.then(() => {
                onProgress({name: t.name});
                return t.ensureFulfilled(this, onProgress).then(value => {
                    onProgress({worked: i + 1, totalWork: transactions.length, subWorked: 0, done: i === transactions.length - 1});
                    return value;
                }).catch(reason => {
                    while (reason && reason.reason) {
                        reason = reason.reason;
                    }
                    throw new TransactionError(t, i, reason);
                });
            });
        };
        return transactions.reduce(ensureFulfilledReducer, Promise.resolve());
    }

    private newRollbackSequence(transactions: Transaction[], error: TransactionError, onProgress: TransactionProgressHandler) {
        onProgress({error: error.reason});
        const rollbackTransactions = transactions.slice(0, error.index + 1);
        let rollbackReducer = (p: Promise<void>, t: Transaction, i: number) => {
            //console.log(`adding ${r.name}`);
            return p.then(() => {
                onProgress({name: `Rolling back "${t.name}"`});
                return t.rollback(this, onProgress).then(value => {
                    onProgress({worked: i, totalWork: transactions.length, subWorked: 0, done: i === 0});
                    return value;
                });
            });
        };
        return rollbackTransactions.reduceRight(rollbackReducer, Promise.resolve());
    }

    private _collectTransactions(transaction: Transaction, collectedTransactions: Transaction[]): void {
        for (let otherTransactionId of transaction.requires) {
            const otherTransaction = this.getTransaction(otherTransactionId);
            this._collectTransactions(otherTransaction, collectedTransactions);
        }
        if (collectedTransactions.indexOf(transaction) === -1) {
            collectedTransactions.push(transaction);
        }
    }
}
