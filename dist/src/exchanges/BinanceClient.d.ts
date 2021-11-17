import { BinanceBase, BinanceClientOptions } from "./BinanceBase";
import { BasicMultiClient, MultiClientOptions } from "../BasicMultiClient";
import { IClient } from "../IClient";
export declare class BinanceClient extends BasicMultiClient {
    options: MultiClientOptions;
    constructor(options?: MultiClientOptions);
    protected _createBasicClient(): IClient;
}
interface SingleClientOptions extends BinanceClientOptions {
    parent: BinanceClient;
}
export declare class BinanceSingleClient extends BinanceBase {
    parent: BinanceClient;
    constructor({ useAggTrades, requestSnapshot, socketBatchSize, socketThrottleMs, restThrottleMs, testNet, wssPath, restL2SnapshotPath, watcherMs, l2updateSpeed, l2snapshotSpeed, batchTickers, parent, }: SingleClientOptions);
}
export {};
