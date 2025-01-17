"use strict";
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinanceFuturesUsdtmSingleClient = void 0;
const Level2Point_1 = require("../Level2Point");
const Level2Snapshots_1 = require("../Level2Snapshots");
const Level2Update_1 = require("../Level2Update");
const BinanceBase_1 = require("./BinanceBase");
const BasicMultiClient_1 = require("../BasicMultiClient");

class BinanceFuturesUsdtmClient extends BasicMultiClient_1.BasicMultiClient {
  constructor(options = {}) {
      super();
      this.options = options;
      this.hasTickers = true;
      this.hasTrades = true;
      this.hasCandles = true;
      this.hasLevel2Updates = true;
      this.hasLevel2Snapshots=true;
      this.marketsPerClient = 100;
      if (typeof options.marketsPerClient !== 'undefined') {
          this.marketsPerClient = options.marketsPerClient;
      }
  }
  _createBasicClient() {
      return new BinanceFuturesUsdtmSingleClient({ ...this.options, parent: this });
  }
}
exports.BinanceFuturesUsdtmClient = BinanceFuturesUsdtmClient;

class BinanceFuturesUsdtmSingleClient extends BinanceBase_1.BinanceBase {
    constructor({ useAggTrades = true, requestSnapshot = true, socketBatchSize = 200, socketThrottleMs = 1000, restThrottleMs = 1000, l2snapshotSpeed = "100ms", l2updateSpeed = "0ms", watcherMs, } = {}) {
        super({
            name: "Binance Futures USDT-M",
            wssPath: "wss://fstream.binance.com/stream",
            restL2SnapshotPath: "https://fapi.binance.com/fapi/v1/depth",
            useAggTrades,
            requestSnapshot,
            socketBatchSize,
            socketThrottleMs,
            restThrottleMs,
            l2snapshotSpeed,
            l2updateSpeed,
            watcherMs,
        });
    }
    /**
   * Custom construction for a partial depth update. This deviates from
   * the spot market by including the `pu` property where updates may
   * not be sequential. The update message looks like:
   * {
      "e": "depthUpdate", // Event type
      "E": 123456789,     // Event time
      "T": 123456788,     // transaction time
      "s": "BTCUSDT",      // Symbol
      "U": 157,           // First update ID in event
      "u": 160,           // Final update ID in event
      "pu": 149,          // Final update Id in last stream(ie `u` in last stream)
      "b": [              // Bids to be updated
        [
          "0.0024",       // Price level to be updated
          "10"            // Quantity
        ]
      ],
      "a": [              // Asks to be updated
        [
          "0.0026",       // Price level to be updated
          "100"          // Quantity
        ]
      ]
    }
   */
    _constructLevel2Update(msg, market) {
        const eventMs = msg.data.E;
        const timestampMs = msg.data.T;
        const sequenceId = msg.data.U;
        const lastSequenceId = msg.data.u;
        const previousLastSequenceId = msg.data.pu;
        const asks = msg.data.a.map(p => new Level2Point_1.Level2Point(p[0], p[1]));
        const bids = msg.data.b.map(p => new Level2Point_1.Level2Point(p[0], p[1]));
        return new Level2Update_1.Level2Update({
            exchange: this.name,
            base: market.base,
            quote: market.quote,
            sequenceId,
            lastSequenceId,
            previousLastSequenceId,
            timestampMs,
            eventMs,
            asks,
            bids,
        });
    }
    /**
   * Partial book snapshot that. This deviates from the spot market by
   * including a previous last update id, `pu`.
      {
        "e": "depthUpdate", // Event type
        "E": 1571889248277, // Event time
        "T": 1571889248276, // transaction time
        "s": "BTCUSDT",
        "U": 390497796,
        "u": 390497878,
        "pu": 390497794,
        "b": [          // Bids to be updated
          [
            "7403.89",  // Price Level to be
            "0.002"     // Quantity
          ],
          [
            "7403.90",
            "3.906"
          ]
        ],
        "a": [          // Asks to be updated
          [
            "7405.96",  // Price level to be
            "3.340"     // Quantity
          ],
          [
            "7406.63",
            "4.525"
          ]
        ]
      }
   */
    _constructLevel2Snapshot(msg, market) {
        const timestampMs = msg.data.E;
        const sequenceId = msg.data.U;
        const lastSequenceId = msg.data.u;
        const previousLastSequenceId = msg.data.pu;
        const asks = msg.data.a.map(p => new Level2Point_1.Level2Point(p[0], p[1]));
        const bids = msg.data.b.map(p => new Level2Point_1.Level2Point(p[0], p[1]));
        return new Level2Snapshots_1.Level2Snapshot({
            exchange: this.name,
            base: market.base,
            quote: market.quote,
            sequenceId,
            lastSequenceId,
            previousLastSequenceId,
            timestampMs,
            asks,
            bids,
        });
    }
}
exports.BinanceFuturesUsdtmSingleClient = BinanceFuturesUsdtmSingleClient;
//# sourceMappingURL=BinanceFuturesUsdtmClient.js.map