"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinanceJexClient = void 0;
const BinanceBase_1 = require("./BinanceBase");
class BinanceJexClient extends BinanceBase_1.BinanceBase {
    constructor({ useAggTrades = true, requestSnapshot = true, socketBatchSize = 200, socketThrottleMs = 1000, restThrottleMs = 1000, watcherMs, l2updateSpeed, l2snapshotSpeed, } = {}) {
        super({
            name: "BinanceJEX",
            wssPath: "wss://ws.jex.com",
            restL2SnapshotPath: "https://www.jex.com/api/v1/contract/depth",
            useAggTrades,
            requestSnapshot,
            socketBatchSize,
            socketThrottleMs,
            restThrottleMs,
            watcherMs,
            l2updateSpeed,
            l2snapshotSpeed,
        });
    }
}
exports.BinanceJexClient = BinanceJexClient;
//# sourceMappingURL=BinanceJexClient.js.map