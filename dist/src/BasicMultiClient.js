"use strict";
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicMultiClient = void 0;
const events_1 = require("events");
const semaphore_1 = __importDefault(require("semaphore"));
const SubscriptionType_1 = require("./SubscriptionType");
const Util_1 = require("./Util");
const NotImplementedFn_1 = require("./NotImplementedFn");
class BasicMultiClient extends events_1.EventEmitter {
    constructor() {
        super();
        this.subscribeLevel3Snapshots = NotImplementedFn_1.NotImplementedFn;
        this.unsubscribeLevel3Snapshots = NotImplementedFn_1.NotImplementedFn;
        this.subscribeLevel3Updates = NotImplementedFn_1.NotImplementedFn;
        this.unsubscribeLevel3Updates = NotImplementedFn_1.NotImplementedFn;
        this._marketsToClients = new Map();
        this._clientsMarkets = new Map();
        this.hasTickers = false;
        this.hasTrades = false;
        this.hasCandles = false;
        this.hasLevel2Snapshots = false;
        this.hasLevel2Updates = false;
        this.hasLevel3Snapshots = false;
        this.hasLevel3Updates = false;
        this.throttleMs = 250;
        this.sem = semaphore_1.default(3); // this can be overriden to allow more or less
        this.marketsPerClient = 1;
    }
    async reconnect() {
        for (const client of Array.from(this._clientsMarkets.keys())) {
            (await client).reconnect();
            await Util_1.wait(this.throttleMs); // delay the reconnection throttling
        }
    }
    async close() {
        for (const client of Array.from(this._clientsMarkets.keys())) {
            (await client).close();
        }
    }
    ////// PUBLIC
    subscribeTicker(market) {
        if (!this.hasTickers)
            return;
        this._subscribe(market, this._marketsToClients, SubscriptionType_1.SubscriptionType.ticker);
    }
    async unsubscribeTicker(market) {
        if (!this.hasTickers)
            return;
        if (this._marketsToClients.has(market.id)) {
            const client = await this._marketsToClients.get(market.id);
            client.unsubscribeTicker(market);
        }
    }
    subscribeCandles(market) {
        if (!this.hasCandles)
            return;
        this._subscribe(market, this._marketsToClients, SubscriptionType_1.SubscriptionType.candle);
    }
    async unsubscribeCandles(market) {
        if (!this.hasCandles)
            return;
        if (this._marketsToClients.has(market.id)) {
            const client = await this._marketsToClients.get(market.id);
            client.unsubscribeCandles(market);
        }
    }
    subscribeTrades(market) {
        if (!this.hasTrades)
            return;
        this._subscribe(market, this._marketsToClients, SubscriptionType_1.SubscriptionType.trade);
    }
    async unsubscribeTrades(market) {
        if (!this.hasTrades)
            return;
        if (this._marketsToClients.has(market.id)) {
            const clientPromise = this._marketsToClients.get(market.id);
            const client = await clientPromise;
            this._marketsToClients.delete(market.id);
            this._clientsMarkets.get(clientPromise).delete(market.id);
            client.unsubscribeTrades(market);
        }
    }
    subscribeLevel2Updates(market) {
        if (!this.hasLevel2Updates)
            return;
        this._subscribe(market, this._marketsToClients, SubscriptionType_1.SubscriptionType.level2update);
    }
    async unsubscribeLevel2Updates(market) {
        if (!this.hasLevel2Updates)
            return;
        if (this._marketsToClients.has(market.id)) {
            const client = await this._marketsToClients.get(market.id);
            client.unsubscribeLevel2Updates(market);
        }
    }
    subscribeLevel2Snapshots(market) {
        if (!this.hasLevel2Snapshots)
            return;
        this._subscribe(market, this._marketsToClients, SubscriptionType_1.SubscriptionType.level2snapshot);
    }
    async unsubscribeLevel2Snapshots(market) {
        if (!this.hasLevel2Snapshots)
            return;
        if (this._marketsToClients.has(market.id)) {
            const client = await this._marketsToClients.get(market.id);
            client.unsubscribeLevel2Snapshots(market);
        }
    }
    ////// PROTECTED
    _createBasicClientThrottled(clientArgs) {
        return new Promise(resolve => {
            this.sem.take(() => {
                // TODO: publish all current markets or don't publish at all?
                const client = this._createBasicClient(clientArgs);
                client.on("connecting", () => this.emit("connecting", clientArgs.market));
                client.on("connected", () => this.emit("connected", clientArgs.market));
                client.on("disconnected", () => this.emit("disconnected", clientArgs.market));
                client.on("reconnecting", () => this.emit("reconnecting", clientArgs.market));
                client.on("closing", () => this.emit("closing", clientArgs.market));
                client.on("closed", () => this.emit("closed", clientArgs.market));
                client.on("error", err => this.emit("error", err, clientArgs.market));
                const clearSem = async () => {
                    await Util_1.wait(this.throttleMs);
                    this.sem.leave();
                    resolve(client);
                };
                client.once("connected", clearSem);
                client._connect();
            });
        });
    }
    async _subscribe(market, map, subscriptionType) {
        try {
            const remote_id = market.id;
            let client = null;
            const freeClient = this._getLeastMarketsClient();
            // create new client if
            // 1. no clients yet
            // 2. all other clients is busy already
            if (freeClient === null
                || this._clientsMarkets.get(freeClient).size >= this.marketsPerClient) {
                const clientArgs = { auth: this.auth, market: market };
                const clientPromise = this._createBasicClientThrottled(clientArgs);
                // we MUST store the promise in here otherwise we will stack up duplicates
                map.set(remote_id, clientPromise);
                this._clientsMarkets.set(clientPromise, new Set([remote_id]));
                client = await clientPromise;
                client.on("ticker", (ticker, market) => {
                    this.emit("ticker", ticker, market);
                });
                client.on("candle", (candle, market) => {
                    this.emit("candle", candle, market);
                });
                client.on("trade", (trade, market) => {
                    this.emit("trade", trade, market);
                });
                client.on("l2update", (l2update, market) => {
                    this.emit("l2update", l2update, market);
                });
                client.on("l2snapshot", (l2snapshot, market) => {
                    this.emit("l2snapshot", l2snapshot, market);
                });
                client.on("l2snapshot", (l2snapshot, market) => {
                    this.emit("l2snapshot", l2snapshot, market);
                });
            }
            else {
                this._clientsMarkets.get(freeClient).add(remote_id);
                map.set(remote_id, freeClient);
                client = await freeClient;
            }
            if (subscriptionType === SubscriptionType_1.SubscriptionType.ticker) {
                client.subscribeTicker(market);
            }
            if (subscriptionType === SubscriptionType_1.SubscriptionType.candle) {
                client.subscribeCandles(market);
            }
            if (subscriptionType === SubscriptionType_1.SubscriptionType.trade) {
                client.subscribeTrades(market);
            }
            if (subscriptionType === SubscriptionType_1.SubscriptionType.level2update) {
                client.subscribeLevel2Updates(market);
            }
            if (subscriptionType === SubscriptionType_1.SubscriptionType.level2snapshot) {
                client.subscribeLevel2Snapshots(market);
            }
        }
        catch (ex) {
            this.emit("error", ex, market);
        }
    }
    // return a client with least clients or null if there is no clients
    _getLeastMarketsClient() {
        let leader = null;
        let leaderSize;
        for (const [client, markets] of this._clientsMarkets) {
            if (leader === null) {
                leader = client;
                leaderSize = markets.size;
            }
            else if (markets.size < leaderSize) {
                leader = client;
                leaderSize = markets.size;
            }
        }
        return leader;
    }
}
exports.BasicMultiClient = BasicMultiClient;
//# sourceMappingURL=BasicMultiClient.js.map