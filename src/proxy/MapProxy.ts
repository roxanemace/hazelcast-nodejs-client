import {BaseProxy} from './BaseProxy';
import {IMap} from './IMap';
import * as Promise from 'bluebird';
import {Data} from '../serialization/Data';
import {MapPutCodec} from '../codec/MapPutCodec';
import ClientMessage = require('../ClientMessage');
import murmur = require('../invocation/Murmur');
import {MapGetCodec} from '../codec/MapGetCodec';
import {MapClearCodec} from '../codec/MapClearCodec';
import {MapSizeCodec} from '../codec/MapSizeCodec';
import {MapRemoveCodec} from '../codec/MapRemoveCodec';
import {MapRemoveIfSameCodec} from '../codec/MapRemoveIfSameCodec';
import {MapContainsKeyCodec} from '../codec/MapContainsKeyCodec';
import {MapContainsValueCodec} from '../codec/MapContainsValueCodec';
import {MapIsEmptyCodec} from '../codec/MapIsEmptyCodec';
import {MapPutAllCodec} from '../codec/MapPutAllCodec';
import {MapDeleteCodec} from '../codec/MapDeleteCodec';
import {MapEntrySetCodec} from '../codec/MapEntrySetCodec';
import {MapEvictCodec} from '../codec/MapEvictCodec';
import {MapEvictAllCodec} from '../codec/MapEvictAllCodec';
import {MapFlushCodec} from '../codec/MapFlushCodec';
import {MapLockCodec} from '../codec/MapLockCodec';
import {MapIsLockedCodec} from '../codec/MapIsLockedCodec';
import {MapUnlockCodec} from '../codec/MapUnlockCodec';
import {MapForceUnlockCodec} from '../codec/MapForceUnlockCodec';
import {MapKeySetCodec} from '../codec/MapKeySetCodec';
import {MapLoadAllCodec} from '../codec/MapLoadAllCodec';
import {MapPutIfAbsentCodec} from '../codec/MapPutIfAbsentCodec';
import {MapPutTransientCodec} from '../codec/MapPutTransientCodec';
import {MapReplaceCodec} from '../codec/MapReplaceCodec';
import {MapReplaceIfSameCodec} from '../codec/MapReplaceIfSameCodec';
import {MapSetCodec} from '../codec/MapSetCodec';
import {MapValuesCodec} from '../codec/MapValuesCodec';
import {MapLoadGivenKeysCodec} from '../codec/MapLoadGivenKeysCodec';
import {MapGetAllCodec} from '../codec/MapGetAllCodec';
import {MapGetEntryViewCodec} from '../codec/MapGetEntryViewCodec';
import {EntryView} from '../core/EntryView';
import {MapAddIndexCodec} from '../codec/MapAddIndexCodec';
import {MapTryLockCodec} from '../codec/MapTryLockCodec';
import {MapTryPutCodec} from '../codec/MapTryPutCodec';
import {MapTryRemoveCodec} from '../codec/MapTryRemoveCodec';
import {IMapListener} from '../core/MapListener';
import {MapAddEntryListenerCodec} from '../codec/MapAddEntryListenerCodec';
import {EntryEventType} from '../core/EntryEventType';
import {MapAddEntryListenerToKeyCodec} from '../codec/MapAddEntryListenerToKeyCodec';
import {MapRemoveEntryListenerCodec} from '../codec/MapRemoveEntryListenerCodec';
import {assertNotNull} from '../Util';
import {Predicate} from '../core/Predicate';
import {MapEntriesWithPredicateCodec} from '../codec/MapEntriesWithPredicateCodec';
import {MapKeySetWithPredicateCodec} from '../codec/MapKeySetWithPredicateCodec';
import {MapValuesWithPredicateCodec} from '../codec/MapValuesWithPredicateCodec';
import {MapAddEntryListenerToKeyWithPredicateCodec} from '../codec/MapAddEntryListenerToKeyWithPredicateCodec';
import {MapAddEntryListenerWithPredicateCodec} from '../codec/MapAddEntryListenerWithPredicateCodec';
export class MapProxy<K, V> extends BaseProxy implements IMap<K, V> {

    entrySetWithPredicate(predicate: Predicate): Promise<any[]> {
        assertNotNull(predicate);
        var pData = this.toData(predicate);
        var toObject = this.toObject.bind(this);
        var deserializedSet: [K, V][] = [];
        return this.encodeInvokeOnRandomTarget(MapEntriesWithPredicateCodec, pData).then(function(entrySet: [Data, Data][]) {
            entrySet.forEach(function(entry) {
                deserializedSet.push([toObject(entry[0]), toObject(entry[1])]);
            });
            return deserializedSet;
        });
    }

    keySetWithPredicate(predicate: Predicate): Promise<K[]> {
        assertNotNull(predicate);
        var predicateData = this.toData(predicate);
        var toObject = this.toObject.bind(this);
        return this.encodeInvokeOnRandomTarget(MapKeySetWithPredicateCodec, predicateData).then(function (entrySet: Data[]) {
            return entrySet.map<K>(toObject);
        });
    }

    valuesWithPredicate(predicate: Predicate): Promise<V[]> {
        assertNotNull(predicate);
        var predicateData = this.toData(predicate);
        var toObject = this.toObject.bind(this);
        return this.encodeInvokeOnRandomTarget(MapValuesWithPredicateCodec, predicateData).then(function (rawValues: Data[]) {
            return rawValues.map<V>(toObject);
        });
    }

    addEntryListenerWithPredicate(listener: IMapListener<K, V>, predicate: Predicate,
                                  key: K = undefined, includeValue: boolean = undefined
    ): Promise<string> {
        return this.addEntryListenerInternal(listener, predicate, key, includeValue);
    }
    containsKey(key: K): Promise<boolean> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MapContainsKeyCodec, keyData, keyData, 0);
    }

    containsValue(value: V): Promise<boolean> {
        assertNotNull(value);
        var valueData = this.toData(value);
        return this.encodeInvokeOnRandomTarget<boolean>(MapContainsValueCodec, valueData);
    }

    put(key: K, value: V, ttl: number = -1): Promise<V> {
        assertNotNull(key);
        assertNotNull(value);
        var keyData: Data = this.toData(key);
        var valueData: Data = this.toData(value);
        return this.encodeInvokeOnKey<V>(MapPutCodec, keyData, keyData, valueData, 0, ttl);
    }

    putAll(pairs: [K, V][]): Promise<void> {
        var partitionService = this.client.getPartitionService();
        var partitionsToKeys: {[id: string]: any} = {};
        var pair: [K, V];
        var pairId: string;
        for (pairId in pairs) {
            pair = pairs[pairId];
            var keyData = this.toData(pair[0]);
            var pId: number = partitionService.getPartitionId(keyData);
            if (!partitionsToKeys[pId]) {
                partitionsToKeys[pId] = [];
            }
            partitionsToKeys[pId].push({key: keyData, val: this.toData(pair[1])});
        }

        var partitionPromises: Promise<void>[] = [];
        for (var partition in partitionsToKeys) {
            partitionPromises.push(
                this.encodeInvokeOnPartition<void>(MapPutAllCodec, Number(partition), partitionsToKeys[partition])
            );
        }
        return Promise.all(partitionPromises).then(function() { return; });
    }

    get(key: K): Promise<V> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<V>(MapGetCodec, keyData, keyData, 0);
    }

    remove(key: K, value: V = null): Promise<V> {
        assertNotNull(key);
        var keyData = this.toData(key);
        if (value == null) {
            return this.encodeInvokeOnKey<V>(MapRemoveCodec, keyData, keyData, 0);
        } else {
            var valueData = this.toData(value);
            return this.encodeInvokeOnKey<V>(MapRemoveIfSameCodec, keyData, keyData, valueData, 0);
        }
    }

    size(): Promise<number> {
        return this.encodeInvokeOnRandomTarget<number>(MapSizeCodec);
    }

    clear(): Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapClearCodec);
    }

    isEmpty(): Promise<boolean> {
        return this.encodeInvokeOnRandomTarget<boolean>(MapIsEmptyCodec);
    }

    getAll(keys: K[]): Promise<any[]> {
        var partitionService = this.client.getPartitionService();
        var partitionsToKeys: {[id: string]: any} = {};
        var key: K;
        for (var i in keys) {
            key = keys[i];
            var keyData = this.toData(key);
            var pId: number = partitionService.getPartitionId(keyData);
            if (!partitionsToKeys[pId]) {
                partitionsToKeys[pId] = [];
            }
            partitionsToKeys[pId].push(keyData);
        }

        var partitionPromises: Promise<[Data, Data][]>[] = [];
        for (var partition in partitionsToKeys) {
            partitionPromises.push(this.encodeInvokeOnPartition<[Data, Data][]>(
                MapGetAllCodec,
                Number(partition),
                partitionsToKeys[partition])
            );
        }
        var toObject = this.toObject.bind(this);
        var deserializeEntry = function(entry: [Data, Data]) {
            return [toObject(entry[0]), toObject(entry[1])];
        };
        return Promise.all(partitionPromises).then(function(serializedEntryArrayArray: [Data, Data][][]) {
            return Array.prototype.concat.apply([], serializedEntryArrayArray).map(deserializeEntry);
        });
    }

    delete(key: K): Promise<void> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MapDeleteCodec, keyData, keyData, 0);
    }

    entrySet(): Promise<any[]> {
        var deserializedSet: [K, V][] = [];
        var toObject = this.toObject.bind(this);
        return this.encodeInvokeOnRandomTarget(MapEntrySetCodec).then(function(entrySet: [Data, Data][]) {
            entrySet.forEach(function(entry) {
                deserializedSet.push([toObject(entry[0]), toObject(entry[1])]);
            });
            return deserializedSet;
        });
    }

    evict(key: K) : Promise<boolean> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MapEvictCodec, keyData, keyData, 0);
    }

    evictAll(): Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapEvictAllCodec);
    }

    flush(): Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapFlushCodec);
    }

    lock(key: K, ttl: number = -1): Promise<void> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MapLockCodec, keyData, keyData, 0, ttl);
    }

    isLocked(key: K): Promise<boolean> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MapIsLockedCodec, keyData, keyData);
    }

    unlock(key: K): Promise<void> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MapUnlockCodec, keyData, keyData, 0);
    }

    forceUnlock(key: K): Promise<void> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MapForceUnlockCodec, keyData, keyData);
    }

    keySet(): Promise<K[]> {
        var toObject = this.toObject.bind(this);
        return this.encodeInvokeOnRandomTarget<K[]>(MapKeySetCodec).then(function(entrySet) {
            return entrySet.map<K>(toObject);
        });
    }

    loadAll(keys: K[] = null, replaceExistingValues: boolean = true): Promise<void> {
        assertNotNull(keys);
        if (keys == null) {
            return this.encodeInvokeOnRandomTarget<void>(MapLoadAllCodec, replaceExistingValues);
        } else {
            var toData = this.toData.bind(this);
            var keysData: Data[] = keys.map<Data>(toData);
            return this.encodeInvokeOnRandomTarget<void>(MapLoadGivenKeysCodec, keysData, replaceExistingValues);
        }
    }

    putIfAbsent(key: K, value: V, ttl: number = -1): Promise<V> {
        assertNotNull(key);
        assertNotNull(value);
        var keyData = this.toData(key);
        var valueData = this.toData(value);
        return this.encodeInvokeOnKey<V>(MapPutIfAbsentCodec, keyData, keyData, valueData, 0, ttl);
    }

    putTransient(key: K, value: V, ttl: number = -1): Promise<void> {
        assertNotNull(key);
        assertNotNull(value);
        var keyData = this.toData(key);
        var valueData = this.toData(value);
        return this.encodeInvokeOnKey<void>(MapPutTransientCodec, keyData, keyData, valueData, 0, ttl);
    }

    replace(key: K, newValue: V): Promise<V> {
        assertNotNull(key);
        assertNotNull(newValue);
        var keyData = this.toData(key);
        var newValueData = this.toData(newValue);
        return this.encodeInvokeOnKey<V>(MapReplaceCodec, keyData, keyData, newValueData, 0);
    }

    replaceIfSame(key: K, oldValue: V, newValue: V): Promise<boolean> {
        assertNotNull(key);
        assertNotNull(oldValue);
        assertNotNull(newValue);
        var keyData = this.toData(key);
        var newValueData = this.toData(newValue);
        var oldValueData = this.toData(oldValue);
        return this.encodeInvokeOnKey<boolean>(MapReplaceIfSameCodec, keyData, keyData, oldValueData, newValueData, 0);
    }

    set(key: K, value: V, ttl: number = -1): Promise<void> {
        assertNotNull(key);
        assertNotNull(value);
        var keyData = this.toData(key);
        var valueData = this.toData(value);
        return this.encodeInvokeOnKey<void>(MapSetCodec, keyData, keyData, valueData, 0, ttl);
    }

    values(): Promise<V[]> {
        var toObject = this.toObject.bind(this);
        return this.encodeInvokeOnRandomTarget<V[]>(MapValuesCodec).then(function(valuesData) {
            return valuesData.map<V>(toObject);
        });
    }

    getEntryView(key: K): Promise<EntryView<K, V>> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<EntryView<K, V>>(MapGetEntryViewCodec, keyData, keyData, 0);
    }

    addIndex(attribute: string, ordered: boolean): Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapAddIndexCodec, attribute, ordered);
    }

    tryLock(key: K, timeout: number = 0, lease: number = -1): Promise<boolean> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MapTryLockCodec, keyData, keyData, 0, lease, timeout);
    }

    tryPut(key: K, value: V, timeout: number): Promise<boolean> {
        assertNotNull(key);
        assertNotNull(value);
        var keyData = this.toData(key);
        var valueData = this.toData(value);
        return this.encodeInvokeOnKey<boolean>(MapTryPutCodec, keyData, keyData, valueData, value, 0, timeout);
    }

    tryRemove(key: K, timeout: number): Promise<boolean> {
        assertNotNull(key);
        var keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MapTryRemoveCodec, keyData, keyData, 0, timeout);
    }

    private addEntryListenerInternal(
        listener: IMapListener<K, V>, predicate: Predicate, key: K, includeValue: boolean
    ): Promise<string> {
        var flags: any = null;
        var conversionTable: {[funcName: string]: EntryEventType} = {
            'added': EntryEventType.ADDED,
            'removed': EntryEventType.REMOVED,
            'updated': EntryEventType.UPDATED,
            'merged': EntryEventType.MERGED,
            'evicted': EntryEventType.EVICTED,
            'evictedAll': EntryEventType.EVICT_ALL,
            'clearedAll': EntryEventType.CLEAR_ALL
        };
        for (var funcName in conversionTable) {
            if (listener[funcName]) {
                /* tslint:disable:no-bitwise */
                flags = flags | conversionTable[funcName];
            }
        }
        var toObject = this.toObject.bind(this);
        var entryEventHandler = function(
            key: K, val: V, oldVal: V, mergingVal: V, event: number, uuid: string, numberOfAffectedEntries: number
        ) {
            var eventParams: any[] = [key, oldVal, val, mergingVal, numberOfAffectedEntries, uuid];
            eventParams = eventParams.map(toObject);
            switch (event) {
                case EntryEventType.ADDED:
                    listener.added.apply(null, eventParams);
                    break;
                case EntryEventType.REMOVED:
                    listener.removed.apply(null, eventParams);
                    break;
                case EntryEventType.UPDATED:
                    listener.updated.apply(null, eventParams);
                    break;
                case EntryEventType.EVICTED:
                    listener.evicted.apply(null, eventParams);
                    break;
                case EntryEventType.EVICT_ALL:
                    listener.evictedAll.apply(null, eventParams);
                    break;
                case EntryEventType.CLEAR_ALL:
                    listener.clearedAll.apply(null, eventParams);
                    break;
                case EntryEventType.MERGED:
                    listener.merged.apply(null, eventParams);
                    break;
            }
        };
        var request: ClientMessage;
        var handler: Function;
        var responser: Function;
        if (key && predicate) {
            var keyData = this.toData(key);
            var predicateData = this.toData(predicate);
            request = MapAddEntryListenerToKeyWithPredicateCodec.encodeRequest(this.name, keyData,
                predicateData, includeValue, flags, false);
            handler = MapAddEntryListenerToKeyWithPredicateCodec.handle;
            responser = MapAddEntryListenerToKeyWithPredicateCodec.decodeResponse;
        } else if (key && !predicate) {
            var keyData = this.toData(key);
            request = MapAddEntryListenerToKeyCodec.encodeRequest(this.name, keyData, includeValue, flags, false);
            handler = MapAddEntryListenerToKeyCodec.handle;
            responser = MapAddEntryListenerToKeyCodec.decodeResponse;
        } else if (!key && predicate) {
            var predicateData = this.toData(predicate);
            request = MapAddEntryListenerWithPredicateCodec.encodeRequest(this.name, predicateData, includeValue, flags, false);
            handler = MapAddEntryListenerWithPredicateCodec.handle;
            responser = MapAddEntryListenerWithPredicateCodec.decodeResponse;
        } else {
            request = MapAddEntryListenerCodec.encodeRequest(this.name, includeValue, flags, false);
            handler = MapAddEntryListenerCodec.handle;
            responser = MapAddEntryListenerCodec.decodeResponse;
        }
        return this.client.getListenerService().registerListener(
            request,
            (m: ClientMessage) => { handler(m, entryEventHandler, toObject); },
            responser
        );
    }

    addEntryListener(listener: IMapListener<K, V>, key: K = undefined, includeValue: boolean = false): Promise<string> {
        return this.addEntryListenerInternal(listener, undefined, key, includeValue);
    }

    removeEntryListener(listenerId: string): Promise<boolean> {
        return this.client.getListenerService().deregisterListener(
            MapRemoveEntryListenerCodec.encodeRequest(this.name, listenerId),
            MapRemoveEntryListenerCodec.decodeResponse
        );
    }
}
