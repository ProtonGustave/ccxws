"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinanceSingleClient = exports.BinanceClient = void 0;
const BinanceBase_1 = require("./BinanceBase");
const BasicMultiClient_1 = require("../BasicMultiClient");
class BinanceClient extends BasicMultiClient_1.BasicMultiClient {
    constructor(options = {}) {
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
    _createBasicClient() {
        return new BinanceSingleClient({ ...this.options, parent: this });
    }
}
exports.BinanceClient = BinanceClient;
class BinanceSingleClient extends BinanceBase_1.BinanceBase {
    constructor({ useAggTrades = true, requestSnapshot = true, socketBatchSize = 200, socketThrottleMs = 1000, restThrottleMs = 1000, testNet = false, wssPath = "wss://stream.binance.com:9443/stream", restL2SnapshotPath = "https://api.binance.com/api/v1/depth", watcherMs, l2updateSpeed, l2snapshotSpeed, batchTickers, parent, }) {
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
exports.BinanceSingleClient = BinanceSingleClient;
//# sourceMappingURL=BinanceClient.js.map