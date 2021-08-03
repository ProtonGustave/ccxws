import { BasicClient } from "../BasicClient";
import { BasicMultiClient, MultiClientOptions } from "../BasicMultiClient";
import { ClientOptions } from "../ClientOptions";
import { Market } from "../Market";
import { IClient } from "../IClient";
export declare class BitfinexClient extends BasicMultiClient {
    options: MultiClientOptions;
    constructor(options?: MultiClientOptions);
    protected _createBasicClient(): IClient;
}
interface SingleClientOptions extends ClientOptions {
    parent: BitfinexClient;
}
export declare class BitfinexSingleClient extends BasicClient {
    l2UpdateDepth: number;
    parent: BitfinexClient;
    protected _channels: any;
    protected _sendSubCandles: (...args: any[]) => any;
    protected _sendSubLevel2Snapshots: (...args: any[]) => any;
    protected _sendSubLevel3Snapshots: (...args: any[]) => any;
    protected _sendUnsubCandles: (...args: any[]) => Promise<any>;
    protected _sendUnsubLevel2Snapshots: (...args: any[]) => Promise<any>;
    protected _sendUnsubLevel3Snapshots: (...args: any[]) => Promise<any>;
    constructor({ wssPath, watcherMs, l2UpdateDepth, parent, }: SingleClientOptions);
    protected _onConnected(): void;
    protected _sendConfiguration(): void;
    protected _sendSubTicker(remote_id: string): void;
    protected _sendUnsubTicker(remote_id: string): void;
    protected _sendSubTrades(remote_id: string): void;
    protected _sendUnsubTrades(remote_id: string): void;
    protected _sendSubLevel2Updates(remote_id: string): void;
    protected _sendUnsubLevel2Updates(remote_id: string): void;
    protected _sendSubLevel3Updates(remote_id: string): void;
    protected _sendUnsubLevel3Updates(remote_id: string): void;
    protected _sendUnsubscribe(chanId: any): void;
    protected _findChannel(type: string, remote_id: string): string;
    protected _onMessage(raw: string): void;
    protected _onTicker(msg: any, market: Market): void;
    protected _onTradeMessage(msg: any, market: Market): void;
    protected _onLevel2Snapshot(msg: any, market: any): void;
    protected _onLevel2Update(msg: any, market: any): void;
    protected _onLevel3Snapshot(msg: any, market: any): void;
    protected _onLevel3Update(msg: any, market: any): void;
}
export {};
