/// <reference types="node" />
import { EventEmitter } from "events";
import semaphore from "semaphore";
import { Market } from "./Market";
import { IClient } from "./IClient";
import { SubscriptionType } from "./SubscriptionType";
export interface MultiClientOptions {
    marketsPerClient?: number;
}
export declare abstract class BasicMultiClient extends EventEmitter {
    marketsPerClient: number;
    name: string;
    hasTickers: boolean;
    hasTrades: boolean;
    hasCandles: boolean;
    hasLevel2Snapshots: boolean;
    hasLevel2Updates: boolean;
    hasLevel3Snapshots: boolean;
    hasLevel3Updates: boolean;
    throttleMs: number;
    sem: semaphore.Semaphore;
    auth: any;
    protected _marketsToClients: Map<string, Promise<IClient>>;
    protected _clientsMarkets: Map<Promise<IClient>, Set<string>>;
    constructor();
    reconnect(): Promise<void>;
    close(): Promise<void>;
    protected abstract _createBasicClient(clientArgs: any): IClient;
    subscribeTicker(market: Market): void;
    unsubscribeTicker(market: Market): Promise<void>;
    subscribeCandles(market: Market): void;
    unsubscribeCandles(market: Market): Promise<void>;
    subscribeTrades(market: any): void;
    unsubscribeTrades(market: Market): Promise<void>;
    subscribeLevel2Updates(market: Market): void;
    unsubscribeLevel2Updates(market: Market): Promise<void>;
    subscribeLevel2Snapshots(market: Market): void;
    unsubscribeLevel2Snapshots(market: Market): Promise<void>;
    subscribeLevel3Snapshots: (...args: any[]) => any;
    unsubscribeLevel3Snapshots: (...args: any[]) => any;
    subscribeLevel3Updates: (...args: any[]) => any;
    unsubscribeLevel3Updates: (...args: any[]) => any;
    protected _createBasicClientThrottled(clientArgs: any): Promise<IClient>;
    protected _subscribe(market: Market, map: Map<string, Promise<IClient>>, subscriptionType: SubscriptionType): Promise<void>;
    protected _getLeastMarketsClient(): Promise<IClient> | null;
}
