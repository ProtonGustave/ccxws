import { BinanceBase, BinanceClientOptions } from "./BinanceBase";
import { BasicMultiClient, MultiClientOptions } from "../BasicMultiClient";
import { IClient } from "../IClient";

export class BinanceClient extends BasicMultiClient {
    public options: MultiClientOptions;

    constructor(options: MultiClientOptions = {}) {
        super();
        this.options = options;
        this.hasTickers = true;
        this.hasTrades = true;
        this.hasCandles = true;
        this.hasLevel2Updates = true;

        if (typeof options.marketsPerClient !== 'undefined') {
          this.marketsPerClient = options.marketsPerClient;
        }
    }

    protected _createBasicClient(): IClient {
        return new BinanceSingleClient({ ...this.options, parent: this });
    }
}

interface SingleClientOptions extends BinanceClientOptions {
  parent: BinanceClient;
}

export class BinanceSingleClient extends BinanceBase {
    public parent: BinanceClient;

    constructor({
        useAggTrades = true,
        requestSnapshot = true,
        socketBatchSize = 200,
        socketThrottleMs = 1000,
        restThrottleMs = 1000,
        testNet = false,
        wssPath = "wss://stream.binance.com:9443/stream",
        restL2SnapshotPath = "https://api.binance.com/api/v1/depth",
        watcherMs,
        l2updateSpeed,
        l2snapshotSpeed,
        batchTickers,
        parent,
    }: SingleClientOptions) {
        if (testNet) {
            wssPath = "wss://testnet.binance.vision/stream";
            restL2SnapshotPath = "https://testnet.binance.vision/api/v1/depth";
        }
        super({
            name: "Binance",
            restL2SnapshotPath,
            wssPath,
            useAggTrades,
            requestSnapshot,
            socketBatchSize,
            socketThrottleMs,
            restThrottleMs,
            watcherMs,
            l2updateSpeed,
            l2snapshotSpeed,
            batchTickers,
        });

        this.parent = parent;
    }
}
