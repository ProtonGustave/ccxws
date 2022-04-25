/// <reference types="node" />
import { BasicClient } from "../BasicClient";
import { Candle } from "../Candle";
import { CandlePeriod } from "../CandlePeriod";
import { ClientOptions } from "../ClientOptions";
import { CancelableFn } from "../flowcontrol/Fn";
import { Level2Snapshot } from "../Level2Snapshots";
import { Level2Update } from "../Level2Update";
import { Market } from "../Market";
import { Ticker } from "../Ticker";
import { Trade } from "../Trade";
export declare type OkexClientOptions = ClientOptions & {
    sendThrottleMs?: number;
};
/**
 * Implements OKEx V5 WebSocket API as defined in
 * https://www.okx.com/docs/en/#websocket-api
 *
 * Limits:
 *    1 connection / second
 *    240 subscriptions / hour
 *
 * Connection will disconnect after 30 seconds of silence
 * it is recommended to send a ping message that contains the
 * message "ping".
 *
 * Order book depth includes maintenance of a checksum for the
 * first 25 values in the orderbook. Each update includes a crc32
 * checksum that can be run to validate that your order book
 * matches the server. If the order book does not match you should
 * issue a reconnect.
 *
 * Refer to: https://www.okx.com/docs/en/#websocket-api-checksum
 */
export declare class OkexClient extends BasicClient {
    candlePeriod: CandlePeriod;
    protected _sendMessage: CancelableFn;
    protected _pingInterval: NodeJS.Timeout;
    constructor({ wssPath, watcherMs, sendThrottleMs, }?: OkexClientOptions);
    protected _beforeClose(): void;
    protected _beforeConnect(): void;
    protected _startPing(): void;
    protected _stopPing(): void;
    protected _sendPing(): void;
    /**
     * Constructs a market argument in a backwards compatible manner where
     * the default is a spot market.
     */
    protected _marketArg(method: string, market: Market): {
        channel: string;
        instId: string;
        instType: string;
    };
    /**
     * Gets the exchanges interpretation of the candle period
     */
    protected _candlePeriod(period: CandlePeriod): "1m" | "3m" | "5m" | "15m" | "30m" | "1D" | "1H" | "2H" | "4H" | "6H" | "12H" | "1W";
    protected __sendMessage(msg: any): void;
    protected _sendSubTicker(remote_id: any, market: any): void;
    protected _sendUnsubTicker(remote_id: any, market: any): void;
    protected _sendSubTrades(remote_id: any, market: any): void;
    protected _sendUnsubTrades(remote_id: any, market: any): void;
    protected _sendSubCandles(remote_id: any, market: any): void;
    protected _sendUnsubCandles(remote_id: any, market: any): void;
    protected _sendSubLevel2Snapshots(remote_id: any, market: any): void;
    protected _sendUnsubLevel2Snapshots(remote_id: any, market: any): void;
    protected _sendSubLevel2Updates(remote_id: any, market: any): void;
    protected _sendUnsubLevel2Updates(remote_id: any, market: any): void;
    protected _sendSubLevel3Snapshots: (...args: any[]) => any;
    protected _sendUnsubLevel3Snapshots: (...args: any[]) => any;
    protected _sendSubLevel3Updates: (...args: any[]) => any;
    protected _sendUnsubLevel3Updates: (...args: any[]) => any;
    protected _onMessage(json: string): void;
    protected _processsMessage(msg: any): void;
    /**
   * Process ticker messages in the format
    {
      arg: { channel: 'tickers', instId: 'BTC-USDT' },
      data: [
        {
          instType: 'SPOT',
          instId: 'BTC-USDT',
          last: '40280',
          lastSz: '0.00339105',
          askPx: '40280.1',
          askSz: '0.59279275',
          bidPx: '40280',
          bidSz: '0.26603777',
          open24h: '42580',
          high24h: '42671.8',
          low24h: '39747.8',
          sodUtc0: '40476',
          sodUtc8: '42142.2',
          volCcy24h: '295680931.82106796',
          vol24h: '7236.9089522',
          ts: '1650636858898'
        }
      ]
    }
   */
    protected _processTicker(msg: any): void;
    /**
   * Processes trade messages in the format
    {
      arg:{ channel: 'trades', instId: 'BTC-USDT' },
      data: [
        {
          instId: 'ETH-BTC',
          px: '0.0218',
          side: 'sell',
          sz: '1.1',
          ts: '1630048897897',
          tradeId: '776432498'
        }
      ]
    }
   */
    protected _processTrades(msg: any): void;
    /**
   * Processes a candle message
    {
      arg: { channel: 'candle1m', instId: 'BTC-USDT' },
      data: [
        [
          '1650643500000',
          '39299.9',
          '39329.9',
          '39223.6',
          '39230.3',
          '46.90395862',
          '1841904.25187161'
        ]
      ]
    }
   */
    protected _processCandles(msg: any): void;
    /**
   * Processes a level 2 snapshot message in the format:
    {
      arg: { channel: 'books5', instId: 'BTC-USDT' },
      data: [
       {
          asks: [
            [ '39629.7', '0.01054105', '0', '3' ],
            [ '39630', '0.003', '0', '1' ],
            [ '39634.7', '0.00272956', '0', '1' ],
            [ '39634.9', '0.32', '0', '1' ],
            [ '39635.5', '0.01', '0', '1' ]
          ],
          bids: [
            [ '39629.6', '7.41993802', '0', '29' ],
            [ '39628.7', '0.01059358', '0', '1' ],
            [ '39628.5', '0.03207637', '0', '1' ],
            [ '39628.4', '4.58225129', '0', '9' ],
            [ '39626.5', '0.1', '0', '1' ]
          ],
          instId: 'BTC-USDT',
          ts: '1650655643181'
        }
      ]
   }
   */
    protected _processLevel2Snapshot(msg: any): void;
    /**
   * Processes a level 2 update message in one of two formats.
   * The first message received is the "snapshot" orderbook and contains
   * 200 records in it.
   *
    {
      "arg": { "channel": "books", "instId": "BTC-USDT" },
      "action": "snapshot",
      "data": [
        {
          "asks": [
            ["8476.98", "415", "0", "13"],
            ["8477", "7", "0", "2"],
            ["8477.34", "85", "0", "1"],
            ["8477.56", "1", "0", "1"],
            ["8505.84", "8", "0", "1"],
            ["8506.37", "85", "0", "1"],
            ["8506.49", "2", "0", "1"],
            ["8506.96", "100", "0", "2"]
          ],
          "bids": [
            ["8476.97", "256", "0", "12"],
            ["8475.55", "101", "0", "1"],
            ["8475.54", "100", "0", "1"],
            ["8475.3", "1", "0", "1"],
            ["8447.32", "6", "0", "1"],
            ["8447.02", "246", "0", "1"],
            ["8446.83", "24", "0", "1"],
            ["8446", "95", "0", "3"]
          ],
          "ts": "1597026383085",
          "checksum": -855196043
        }
      ]
    }
   *
   * Subsequent calls will include the updates stream for changes to
   * the order book:
   *
     {
      "arg": { "channel": "books", "instId": "BTC-USDT" },
      "action": "update",
      "data": [
        {
          "asks": [
            ["8476.98", "415", "0", "13"],
            ["8477", "7", "0", "2"],
            ["8477.34", "85", "0", "1"],
            ["8477.56", "1", "0", "1"],
            ["8505.84", "8", "0", "1"],
            ["8506.37", "85", "0", "1"],
            ["8506.49", "2", "0", "1"],
            ["8506.96", "100", "0", "2"]
          ],
          "bids": [
            ["8476.97", "256", "0", "12"],
            ["8475.55", "101", "0", "1"],
            ["8475.54", "100", "0", "1"],
            ["8475.3", "1", "0", "1"],
            ["8447.32", "6", "0", "1"],
            ["8447.02", "246", "0", "1"],
            ["8446.83", "24", "0", "1"],
            ["8446", "95", "0", "3"]
          ],
          "ts": "1597026383085",
          "checksum": -855196043
        }
      ]
    }
   */
    protected _processLevel2Update(msg: any): void;
    /**
   * Constructs a ticker from the datum in the format:
    {
      instType: 'SPOT',
      instId: 'BTC-USDT',
      last: '40280',
      lastSz: '0.00339105',
      askPx: '40280.1',
      askSz: '0.59279275',
      bidPx: '40280',
      bidSz: '0.26603777',
      open24h: '42580',
      high24h: '42671.8',
      low24h: '39747.8',
      sodUtc0: '40476',
      sodUtc8: '42142.2',
      volCcy24h: '295680931.82106796',
      vol24h: '7236.9089522',
      ts: '1650636858898'
    }
   */
    protected _constructTicker(data: any, market: any): Ticker;
    /**
   * Constructs a trade from the message datum in format:
    {
      instId: 'ETH-BTC',
      px: '0.02182',
      side: 'sell',
      sz: '0.94',
      ts: '1630048897897',
      tradeId: '776370532'
    }
    */
    protected _constructTrade(datum: any, market: any): Trade;
    /**
   * Constructs a candle for the market
    [
      '1650643500000',
      '39299.9',
      '39329.9',
      '39223.6',
      '39230.3',
      '46.90395862',
      '1841904.25187161'
    ]
   * @param {*} datum
   */
    protected _constructCandle(datum: any): Candle;
    /**
   * Constructs a snapshot message from the datum in a
   * snapshot message data property. Datum in the format:
   *
    {
      asks: [
        [ '39629.7', '0.01054105', '0', '3' ],
        [ '39630', '0.003', '0', '1' ],
        [ '39634.7', '0.00272956', '0', '1' ],
        [ '39634.9', '0.32', '0', '1' ],
        [ '39635.5', '0.01', '0', '1' ]
      ],
      bids: [
        [ '39629.6', '7.41993802', '0', '29' ],
        [ '39628.7', '0.01059358', '0', '1' ],
        [ '39628.5', '0.03207637', '0', '1' ],
        [ '39628.4', '4.58225129', '0', '9' ],
        [ '39626.5', '0.1', '0', '1' ]
      ],
      instId: 'BTC-USDT',
      ts: '1650655643181'
    }
   *
   * The snapshot may also come from an update, in which case we need
   * to include the checksum
   *
    {
      "asks": [
        ["8476.98", "415", "0", "13"],
        ["8477", "7", "0", "2"],
        ["8477.34", "85", "0", "1"],
        ["8477.56", "1", "0", "1"],
        ["8505.84", "8", "0", "1"],
        ["8506.37", "85", "0", "1"],
        ["8506.49", "2", "0", "1"],
        ["8506.96", "100", "0", "2"]
      ],
      "bids": [
        ["8476.97", "256", "0", "12"],
        ["8475.55", "101", "0", "1"],
        ["8475.54", "100", "0", "1"],
        ["8475.3", "1", "0", "1"],
        ["8447.32", "6", "0", "1"],
        ["8447.02", "246", "0", "1"],
        ["8446.83", "24", "0", "1"],
        ["8446", "95", "0", "3"]
      ],
      "ts": "1597026383085",
      "checksum": -855196043
    }
   */
    protected _constructLevel2Snapshot(datum: any, market: any): Level2Snapshot;
    /**
   * Constructs an update message from the datum in the update
   * stream. Datum is in the format:
    {
      "asks": [
        ["8476.98", "415", "0", "13"],
        ["8477", "7", "0", "2"],
        ["8477.34", "85", "0", "1"],
        ["8477.56", "1", "0", "1"],
        ["8505.84", "8", "0", "1"],
        ["8506.37", "85", "0", "1"],
        ["8506.49", "2", "0", "1"],
        ["8506.96", "100", "0", "2"]
      ],
      "bids": [
        ["8476.97", "256", "0", "12"],
        ["8475.55", "101", "0", "1"],
        ["8475.54", "100", "0", "1"],
        ["8475.3", "1", "0", "1"],
        ["8447.32", "6", "0", "1"],
        ["8447.02", "246", "0", "1"],
        ["8446.83", "24", "0", "1"],
        ["8446", "95", "0", "3"]
      ],
      "ts": "1597026383085",
      "checksum": -855196043
    }
   */
    _constructLevel2Update(datum: any, market: any): Level2Update;
}
