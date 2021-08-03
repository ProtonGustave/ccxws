/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { BasicClient } from "../BasicClient";
import { BasicMultiClient, MultiClientOptions } from "../BasicMultiClient";
import { ClientOptions } from "../ClientOptions";
import { Level2Point } from "../Level2Point";
import { Level2Snapshot } from "../Level2Snapshots";
import { Level2Update } from "../Level2Update";
import { Level3Point } from "../Level3Point";
import { Level3Snapshot } from "../Level3Snapshot";
import { Level3Update } from "../Level3Update";
import { Market } from "../Market";
import { NotImplementedAsyncFn, NotImplementedFn } from "../NotImplementedFn";
import { Ticker } from "../Ticker";
import { Trade } from "../Trade";
import { IClient } from "../IClient";

export class BitfinexClient extends BasicMultiClient {
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
        return new BitfinexSingleClient({ ...this.options, parent: this });
    }
}

interface SingleClientOptions extends ClientOptions {
  parent: BitfinexClient;
}

export class BitfinexSingleClient extends BasicClient {
    public l2UpdateDepth: number;
    public parent: BitfinexClient;

    protected _channels: any;
    protected _sendSubCandles = NotImplementedFn;
    protected _sendSubLevel2Snapshots = NotImplementedFn;
    protected _sendSubLevel3Snapshots = NotImplementedFn;
    protected _sendUnsubCandles = NotImplementedAsyncFn;
    protected _sendUnsubLevel2Snapshots = NotImplementedAsyncFn;
    protected _sendUnsubLevel3Snapshots = NotImplementedAsyncFn;

    constructor({
        wssPath = "wss://api.bitfinex.com/ws/2",
        watcherMs,
        l2UpdateDepth = 250,
        parent,
    }: SingleClientOptions) {
        super(wssPath, "Bitfinex", undefined, watcherMs);
        this._channels = {};

        this.hasTickers = true;
        this.hasTrades = true;
        this.hasLevel2Updates = true;
        this.hasLevel3Updates = true;
        this.l2UpdateDepth = l2UpdateDepth;
        this.parent = parent;
    }

    protected _onConnected() {
        // immediately send the config event to include sequence IDs in every message
        this._sendConfiguration();
        super._onConnected();
    }

    protected _sendConfiguration() {
        // see docs for "conf" flags. https://docs.bitfinex.com/docs/ws-general#configuration
        // combine multiple flags by summing their values
        // 65536 adds a sequence ID to each message
        // 32768 adds a Timestamp in milliseconds to each received event
        // 131072 Enable checksum for every book iteration. Checks the top 25 entries for each side of book. Checksum is a signed int. more info https://docs.bitfinex.com/docs/ws-websocket-checksum. it's sent in its own
        // separate event so we've disabled it
        this._wss.send(JSON.stringify({ event: "conf", flags: 65536 + 32768 }));
    }

    protected _sendSubTicker(remote_id: string) {
        this._wss.send(
            JSON.stringify({
                event: "subscribe",
                channel: "ticker",
                pair: remote_id,
            }),
        );
    }

    protected _sendUnsubTicker(remote_id: string) {
        this._wss.send(
            JSON.stringify({
                event: "unsubscribe",
                channel: "ticker",
                pair: remote_id,
            }),
        );
    }

    protected _sendSubTrades(remote_id: string) {
        this._wss.send(
            JSON.stringify({
                event: "subscribe",
                channel: "trades",
                pair: remote_id,
            }),
        );
    }

    protected _sendUnsubTrades(remote_id: string) {
        const chanId = this._findChannel("trades", remote_id);
        this._sendUnsubscribe(chanId);
    }

    protected _sendSubLevel2Updates(remote_id: string) {
        this._wss.send(
            JSON.stringify({
                event: "subscribe",
                channel: "book",
                pair: remote_id,
                len: String(this.l2UpdateDepth), // len must be of type string, even though it's a number
            }),
        );
    }

    protected _sendUnsubLevel2Updates(remote_id: string) {
        const chanId = this._findChannel("level2updates", remote_id);
        this._sendUnsubscribe(chanId);
    }

    protected _sendSubLevel3Updates(remote_id: string) {
        this._wss.send(
            JSON.stringify({
                event: "subscribe",
                channel: "book",
                pair: remote_id,
                prec: "R0",
                length: "100",
            }),
        );
    }

    protected _sendUnsubLevel3Updates(remote_id: string) {
        const chanId = this._findChannel("level3updates", remote_id);
        this._sendUnsubscribe(chanId);
    }

    protected _sendUnsubscribe(chanId) {
        if (chanId) {
            this._wss.send(
                JSON.stringify({
                    event: "unsubscribe",
                    chanId: chanId,
                }),
            );
        }
    }

    protected _findChannel(type: string, remote_id: string): string {
        for (const raw of Object.values(this._channels)) {
            const chan = raw as any;
            if (chan.pair === remote_id) {
                if (type === "trades" && chan.channel === "trades") return chan.chanId;
                if (type === "level2updates" && chan.channel === "book" && chan.prec !== "R0")
                    return chan.chanId;
                if (type === "level3updates" && chan.channel === "book" && chan.prec === "R0")
                    return chan.chanId;
            }
        }
    }

    protected _onMessage(raw: string) {
        const msg = JSON.parse(raw);

        // capture channel metadata
        if (msg.event === "subscribed") {
            this._channels[msg.chanId] = msg;
            return;
        }

        // lookup channel
        const channel = this._channels[msg[0]];
        if (!channel) return;

        // ignore heartbeats
        if (msg[1] === "hb") return;

        if (channel.channel === "ticker") {
            const market = this._tickerSubs.get(channel.pair);
            if (!market) return;

            this._onTicker(msg, market);
            return;
        }

        // trades
        if (channel.channel === "trades" && msg[1] === "tu") {
            const market = this._tradeSubs.get(channel.pair);
            if (!market) return;

            this._onTradeMessage(msg, market);
            return;
        }

        // level3
        if (channel.channel === "book" && channel.prec === "R0") {
            const market = this._level3UpdateSubs.get(channel.pair);
            if (!market) return;

            if (Array.isArray(msg[1][0])) this._onLevel3Snapshot(msg, market);
            else this._onLevel3Update(msg, market);
            return;
        }

        // level2
        if (channel.channel === "book") {
            const market = this._level2UpdateSubs.get(channel.pair);
            if (!market) return;
            if (Array.isArray(msg[1][0])) this._onLevel2Snapshot(msg, market);
            else this._onLevel2Update(msg, market);
            return;
        }
    }

    protected _onTicker(msg: any, market: Market) {
        const msgBody = msg[1];
        const sequenceId = Number(msg[2]);
        const [bid, bidSize, ask, askSize, change, changePercent, last, volume, high, low] =
            msgBody;
        const open = last + change;
        const ticker = new Ticker({
            exchange: "Bitfinex",
            base: market.base,
            quote: market.quote,
            timestamp: Date.now(),
            sequenceId,
            last: last.toFixed(8),
            open: open.toFixed(8),
            high: high.toFixed(8),
            low: low.toFixed(8),
            volume: volume.toFixed(8),
            change: change.toFixed(8),
            changePercent: changePercent.toFixed(2),
            bid: bid.toFixed(8),
            bidVolume: bidSize.toFixed(8),
            ask: ask.toFixed(8),
            askVolume: askSize.toFixed(8),
        });
        this.emit("ticker", ticker, market);
    }

    protected _onTradeMessage(msg: any, market: Market) {
        // example msg: [ 359491, 'tu', [ 560287312, 1609712228656, 0.005, 33432 ], 6 ]
        let [id, unix, amount, price] = msg[2];
        const sequenceId = Number(msg[3]);

        const side = amount > 0 ? "buy" : "sell";
        price = price.toFixed(8);
        amount = Math.abs(amount).toFixed(8);
        const trade = new Trade({
            exchange: "Bitfinex",
            base: market.base,
            quote: market.quote,
            tradeId: id.toFixed(),
            sequenceId,
            unix: unix,
            side,
            price,
            amount,
        });
        this.emit("trade", trade, market);
    }

    protected _onLevel2Snapshot(msg, market) {
        /*
    example msg:
      [
        646750,
        [
          [ 31115, 1, 1 ],
          [ 31114, 1, 0.31589592 ],
          ...
        ],
        1,
        1609794291015
      ]
  */
        const bids = [];
        const asks = [];
        const sequenceId = Number(msg[2]);
        const timestampMs = msg[3];
        for (const [price, count, size] of msg[1]) {
            const isBid = size > 0;
            const result = new Level2Point(
                price.toFixed(8),
                Math.abs(size).toFixed(8),
                count.toFixed(0),
            );
            if (isBid) bids.push(result);
            else asks.push(result);
        }
        const result = new Level2Snapshot({
            exchange: "Bitfinex",
            base: market.base,
            quote: market.quote,
            sequenceId,
            timestampMs,
            bids,
            asks,
        });
        this.emit("l2snapshot", result, market);
    }

    protected _onLevel2Update(msg, market) {
        // example msg: [ 646750, [ 30927, 5, 0.0908 ], 19, 1609794565952 ]
        const [price, count, size] = msg[1];
        const sequenceId = Number(msg[2]);
        const timestampMs = msg[3];

        if (!price.toFixed) return;
        const point = new Level2Point(
            price.toFixed(8),
            Math.abs(size).toFixed(8),
            count.toFixed(0),
        );
        const asks = [];
        const bids = [];

        const isBid = size > 0;
        if (isBid) bids.push(point);
        else asks.push(point);

        const isDelete = count === 0;
        if (isDelete) (point as any).size = (0).toFixed(8); // reset the size to 0, comes in as 1 or -1 to indicate bid/ask
        const update = new Level2Update({
            exchange: "Bitfinex",
            base: market.base,
            quote: market.quote,
            sequenceId,
            timestampMs,
            asks,
            bids,
        });
        this.emit("l2update", update, market);
    }

    protected _onLevel3Snapshot(msg, market) {
        /*
    example msg:
    [
      648087,
      [
        [ 55888179267, 31111, 0.05 ],
        [ 55895806791, 31111, 0.989 ],
        ...
      ],
      1,
      1609794565952
    ]
    */
        const bids = [];
        const asks = [];

        const orders = msg[1];
        const sequenceId = Number(msg[2]);
        const timestampMs = msg[3];

        for (const [orderId, price, size] of orders) {
            const point = new Level3Point(
                orderId.toFixed(),
                price.toFixed(8),
                Math.abs(size).toFixed(8),
            );
            if (size > 0) bids.push(point);
            else asks.push(point);
        }
        const result = new Level3Snapshot({
            exchange: "Bitfinex",
            base: market.base,
            quote: market.quote,
            sequenceId,
            timestampMs,
            asks,
            bids,
        });
        this.emit("l3snapshot", result, market);
    }

    protected _onLevel3Update(msg, market) {
        // example msg: [ 648087, [ 55895794256, 31107, 0.07799627 ], 4, 1609794565952 ]
        const bids = [];
        const asks = [];

        const [orderId, price, size] = msg[1];
        const sequenceId = Number(msg[2]);
        const timestampMs = msg[3];

        const point = new Level3Point(
            orderId.toFixed(),
            price.toFixed(8),
            Math.abs(size).toFixed(8),
        );
        if (size > 0) bids.push(point);
        else asks.push(point);

        const result = new Level3Update({
            exchange: "Bitfinex",
            base: market.base,
            quote: market.quote,
            sequenceId,
            timestampMs,
            asks,
            bids,
        });
        this.emit("l3update", result, market);
    }
}
