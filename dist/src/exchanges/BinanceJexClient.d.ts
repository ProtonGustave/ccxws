import { BinanceBase, BinanceClientOptions } from "./BinanceBase";
export declare class BinanceJexClient extends BinanceBase {
    constructor({ useAggTrades, requestSnapshot, socketBatchSize, socketThrottleMs, restThrottleMs, watcherMs, l2updateSpeed, l2snapshotSpeed, }?: BinanceClientOptions);
}
