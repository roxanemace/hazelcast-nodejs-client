/*
 * Copyright (c) 2008-2018, Hazelcast, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Promise from 'bluebird';
import {Aggregator} from '../aggregation/Aggregator';
import {MapAddEntryListenerCodec} from '../codec/MapAddEntryListenerCodec';
import {MapAddEntryListenerToKeyCodec} from '../codec/MapAddEntryListenerToKeyCodec';
import {MapAddEntryListenerToKeyWithPredicateCodec} from '../codec/MapAddEntryListenerToKeyWithPredicateCodec';
import {MapAddEntryListenerWithPredicateCodec} from '../codec/MapAddEntryListenerWithPredicateCodec';
import {MapAddIndexCodec} from '../codec/MapAddIndexCodec';
import {MapAggregateCodec} from '../codec/MapAggregateCodec';
import {MapAggregateWithPredicateCodec} from '../codec/MapAggregateWithPredicateCodec';
import {MapClearCodec} from '../codec/MapClearCodec';
import {MapContainsKeyCodec} from '../codec/MapContainsKeyCodec';
import {MapContainsValueCodec} from '../codec/MapContainsValueCodec';
import {MapDeleteCodec} from '../codec/MapDeleteCodec';
import {MapEntriesWithPredicateCodec} from '../codec/MapEntriesWithPredicateCodec';
import {MapEntrySetCodec} from '../codec/MapEntrySetCodec';
import {MapEvictAllCodec} from '../codec/MapEvictAllCodec';
import {MapEvictCodec} from '../codec/MapEvictCodec';
import {MapExecuteOnAllKeysCodec} from '../codec/MapExecuteOnAllKeysCodec';
import {MapExecuteOnKeyCodec} from '../codec/MapExecuteOnKeyCodec';
import {MapExecuteOnKeysCodec} from '../codec/MapExecuteOnKeysCodec';
import {MapExecuteWithPredicateCodec} from '../codec/MapExecuteWithPredicateCodec';
import {MapFlushCodec} from '../codec/MapFlushCodec';
import {MapForceUnlockCodec} from '../codec/MapForceUnlockCodec';
import {MapGetAllCodec} from '../codec/MapGetAllCodec';
import {MapGetCodec} from '../codec/MapGetCodec';
import {MapGetEntryViewCodec} from '../codec/MapGetEntryViewCodec';
import {MapIsEmptyCodec} from '../codec/MapIsEmptyCodec';
import {MapIsLockedCodec} from '../codec/MapIsLockedCodec';
import {MapKeySetCodec} from '../codec/MapKeySetCodec';
import {MapKeySetWithPagingPredicateCodec} from '../codec/MapKeySetWithPagingPredicateCodec';
import {MapKeySetWithPredicateCodec} from '../codec/MapKeySetWithPredicateCodec';
import {MapLoadAllCodec} from '../codec/MapLoadAllCodec';
import {MapLoadGivenKeysCodec} from '../codec/MapLoadGivenKeysCodec';
import {MapLockCodec} from '../codec/MapLockCodec';
import {MapPutAllCodec} from '../codec/MapPutAllCodec';
import {MapPutCodec} from '../codec/MapPutCodec';
import {MapPutIfAbsentCodec} from '../codec/MapPutIfAbsentCodec';
import {MapPutTransientCodec} from '../codec/MapPutTransientCodec';
import {MapRemoveCodec} from '../codec/MapRemoveCodec';
import {MapRemoveEntryListenerCodec} from '../codec/MapRemoveEntryListenerCodec';
import {MapRemoveIfSameCodec} from '../codec/MapRemoveIfSameCodec';
import {MapReplaceCodec} from '../codec/MapReplaceCodec';
import {MapReplaceIfSameCodec} from '../codec/MapReplaceIfSameCodec';
import {MapSetCodec} from '../codec/MapSetCodec';
import {MapSizeCodec} from '../codec/MapSizeCodec';
import {MapTryLockCodec} from '../codec/MapTryLockCodec';
import {MapTryPutCodec} from '../codec/MapTryPutCodec';
import {MapTryRemoveCodec} from '../codec/MapTryRemoveCodec';
import {MapUnlockCodec} from '../codec/MapUnlockCodec';
import {MapValuesCodec} from '../codec/MapValuesCodec';
import {MapValuesWithPagingPredicateCodec} from '../codec/MapValuesWithPagingPredicateCodec';
import {MapValuesWithPredicateCodec} from '../codec/MapValuesWithPredicateCodec';
import {EntryEventType} from '../core/EntryEventType';
import {EntryView} from '../core/EntryView';
import {IMapListener} from '../core/MapListener';
import {IterationType, Predicate} from '../core/Predicate';
import {ReadOnlyLazyList} from '../core/ReadOnlyLazyList';
import {ListenerMessageCodec} from '../ListenerMessageCodec';
import {Data} from '../serialization/Data';
import {PagingPredicate} from '../serialization/DefaultPredicates';
import {IdentifiedDataSerializable, Portable} from '../serialization/Serializable';
import * as SerializationUtil from '../serialization/SerializationUtil';
import {assertArray, assertNotNull, getSortedQueryResultSet} from '../Util';
import {BaseProxy} from './BaseProxy';
import {IMap} from './IMap';
import ClientMessage = require('../ClientMessage');

export class MapProxy<K, V> extends BaseProxy implements IMap<K, V> {
    aggregate<R>(aggregator: Aggregator<R>): Promise<R> {
        assertNotNull(aggregator);
        const aggregatorData = this.toData(aggregator);
        return this.encodeInvokeOnRandomTarget(MapAggregateCodec, aggregatorData);
    }

    aggregateWithPredicate<R>(aggregator: Aggregator<R>, predicate: Predicate): Promise<R> {
        assertNotNull(aggregator);
        assertNotNull(predicate);
        this.checkNotPagingPredicate(predicate);
        const aggregatorData = this.toData(aggregator);
        const predicateData = this.toData(predicate);
        return this.encodeInvokeOnRandomTarget(MapAggregateWithPredicateCodec, aggregatorData, predicateData);
    }

    executeOnKeys(keys: K[], entryProcessor: IdentifiedDataSerializable | Portable): Promise<any[]> {
        assertNotNull(keys);
        assertArray(keys);
        if (keys.length === 0) {
            return Promise.resolve([]);
        } else {
            const toObject = this.toObject.bind(this);
            const keysData = SerializationUtil.serializeList(this.toData.bind(this), keys);
            const proData = this.toData(entryProcessor);
            return this.encodeInvokeOnRandomTarget(MapExecuteOnKeysCodec, proData, keysData)
                .then<Array<[K, V]>>(SerializationUtil.deserializeEntryList.bind(this, toObject));
        }
    }

    executeOnKey(key: K, entryProcessor: IdentifiedDataSerializable | Portable): Promise<V> {
        assertNotNull(key);
        assertNotNull(entryProcessor);
        const keyData = this.toData(key);
        const proData = this.toData(entryProcessor);

        return this.executeOnKeyInternal(keyData, proData);
    }

    executeOnEntries(entryProcessor: IdentifiedDataSerializable | Portable, predicate: Predicate = null): Promise<Array<[K, V]>> {
        assertNotNull(entryProcessor);
        const proData = this.toData(entryProcessor);
        const toObject = this.toObject.bind(this);

        if (predicate == null) {
            return this.encodeInvokeOnRandomTarget<Array<[Data, Data]>>(MapExecuteOnAllKeysCodec, proData)
                .then<Array<[K, V]>>(SerializationUtil.deserializeEntryList.bind(this, toObject));
        } else {
            const predData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapExecuteWithPredicateCodec, proData, predData)
                .then<Array<[K, V]>>(SerializationUtil.deserializeEntryList.bind(this, toObject));
        }

    }

    entrySetWithPredicate(predicate: Predicate): Promise<any[]> {
        assertNotNull(predicate);
        const toObject = this.toObject.bind(this);
        if (predicate instanceof PagingPredicate) {
            predicate.setIterationType(IterationType.ENTRY);
            const pData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(
                MapValuesWithPagingPredicateCodec, pData,
            ).then(function (rawValues: Array<[Data, Data]>) {
                const deserValues = rawValues.map<[K, V]>(function (ite: [Data, Data]) {
                    return [toObject(ite[0]), toObject(ite[1])];
                });
                return getSortedQueryResultSet(deserValues, predicate);
            });
        } else {
            const pData = this.toData(predicate);
            const deserializedSet: Array<[K, V]> = [];
            return this.encodeInvokeOnRandomTarget(MapEntriesWithPredicateCodec, pData).then(
                function (entrySet: Array<[Data, Data]>) {
                    entrySet.forEach(function (entry) {
                        deserializedSet.push([toObject(entry[0]), toObject(entry[1])]);
                    });
                    return deserializedSet;
                });
        }
    }

    keySetWithPredicate(predicate: Predicate): Promise<K[]> {
        assertNotNull(predicate);
        const toObject = this.toObject.bind(this);
        if (predicate instanceof PagingPredicate) {
            predicate.setIterationType(IterationType.KEY);
            const predData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapKeySetWithPagingPredicateCodec, predData).then(
                function (rawValues: Data[]) {
                    const deserValues = rawValues.map<[K, V]>(function (ite: Data) {
                        return [toObject(ite), null];
                    });
                    return getSortedQueryResultSet(deserValues, predicate);
                });
        } else {
            const predicateData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapKeySetWithPredicateCodec, predicateData).then(function (entrySet: Data[]) {
                return entrySet.map<K>(toObject);
            });
        }
    }

    valuesWithPredicate(predicate: Predicate): Promise<ReadOnlyLazyList<V>> {
        assertNotNull(predicate);
        const toObject = this.toObject.bind(this);
        if (predicate instanceof PagingPredicate) {
            predicate.setIterationType(IterationType.VALUE);
            const predData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(
                MapValuesWithPagingPredicateCodec, predData,
            ).then((rawValues: Array<[Data, Data]>) => {
                const desValues = rawValues.map<[K, V]>(function (ite: [Data, Data]) {
                    return [toObject(ite[0]), toObject(ite[1])];
                });
                return new ReadOnlyLazyList(getSortedQueryResultSet(desValues, predicate), this.client.getSerializationService());
            });
        } else {
            const predicateData = this.toData(predicate);
            return this.encodeInvokeOnRandomTarget(MapValuesWithPredicateCodec, predicateData).then((rawValues: Data[]) => {
                return new ReadOnlyLazyList(rawValues, this.client.getSerializationService());
            });
        }
    }

    addEntryListenerWithPredicate(listener: IMapListener<K, V>, predicate: Predicate, key: K,
                                  includeValue: boolean): Promise<string> {
        return this.addEntryListenerInternal(listener, predicate, key, includeValue);
    }

    containsKey(key: K): Promise<boolean> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.containsKeyInternal(keyData);
    }

    containsValue(value: V): Promise<boolean> {
        assertNotNull(value);
        const valueData = this.toData(value);
        return this.encodeInvokeOnRandomTarget<boolean>(MapContainsValueCodec, valueData);
    }

    put(key: K, value: V, ttl: number = -1): Promise<V> {
        assertNotNull(key);
        assertNotNull(value);
        const keyData: Data = this.toData(key);
        const valueData: Data = this.toData(value);
        return this.putInternal(keyData, valueData, ttl);
    }

    putAll(pairs: Array<[K, V]>): Promise<void> {
        const partitionService = this.client.getPartitionService();
        const partitionsToKeys: { [id: string]: any } = {};
        let pair: [K, V];
        let pairId: string;
        for (pairId in pairs) {
            pair = pairs[pairId];
            const keyData = this.toData(pair[0]);
            const pId: number = partitionService.getPartitionId(keyData);
            if (!partitionsToKeys[pId]) {
                partitionsToKeys[pId] = [];
            }
            partitionsToKeys[pId].push([keyData, this.toData(pair[1])]);
        }
        return this.putAllInternal(partitionsToKeys);
    }

    get(key: K): Promise<V> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.getInternal(keyData);
    }

    remove(key: K, value: V = null): Promise<V> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.removeInternal(keyData, value);
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
        assertNotNull(keys);
        assertArray(keys);
        const partitionService = this.client.getPartitionService();
        const partitionsToKeys: { [id: string]: any } = {};
        let key: K;
        for (const i in keys) {
            key = keys[i];
            const keyData = this.toData(key);
            const pId: number = partitionService.getPartitionId(keyData);
            if (!partitionsToKeys[pId]) {
                partitionsToKeys[pId] = [];
            }
            partitionsToKeys[pId].push(keyData);
        }
        const result: Array<[any, any]> = [];
        return this.getAllInternal(partitionsToKeys, result).then(function () {

            return result;
        });
    }

    delete(key: K): Promise<void> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.deleteInternal(keyData);
    }

    entrySet(): Promise<any[]> {
        const deserializedSet: Array<[K, V]> = [];
        const toObject = this.toObject.bind(this);
        return this.encodeInvokeOnRandomTarget(MapEntrySetCodec).then(function (entrySet: Array<[Data, Data]>) {
            entrySet.forEach(function (entry) {
                deserializedSet.push([toObject(entry[0]), toObject(entry[1])]);
            });
            return deserializedSet;
        });
    }

    evict(key: K): Promise<boolean> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.evictInternal(keyData);
    }

    evictAll(): Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapEvictAllCodec);
    }

    flush(): Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapFlushCodec);
    }

    lock(key: K, ttl: number = -1): Promise<void> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MapLockCodec, keyData, keyData, 0, ttl, 0);
    }

    isLocked(key: K): Promise<boolean> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MapIsLockedCodec, keyData, keyData);
    }

    unlock(key: K): Promise<void> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MapUnlockCodec, keyData, keyData, 0, 0);
    }

    forceUnlock(key: K): Promise<void> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey<void>(MapForceUnlockCodec, keyData, keyData, 0);
    }

    keySet(): Promise<K[]> {
        const toObject = this.toObject.bind(this);
        return this.encodeInvokeOnRandomTarget<K[]>(MapKeySetCodec).then(function (entrySet) {
            return entrySet.map<K>(toObject);
        });
    }

    loadAll(keys: K[] = null, replaceExistingValues: boolean = true): Promise<void> {
        if (keys == null) {
            return this.encodeInvokeOnRandomTarget<void>(MapLoadAllCodec, replaceExistingValues);
        } else {
            const toData = this.toData.bind(this);
            const keysData: Data[] = keys.map<Data>(toData);
            return this.encodeInvokeOnRandomTarget<void>(MapLoadGivenKeysCodec, keysData, replaceExistingValues);
        }
    }

    putIfAbsent(key: K, value: V, ttl: number = -1): Promise<V> {
        assertNotNull(key);
        assertNotNull(value);
        const keyData = this.toData(key);
        const valueData = this.toData(value);
        return this.putIfAbsentInternal(keyData, valueData, ttl);
    }

    putTransient(key: K, value: V, ttl: number = -1): Promise<void> {
        assertNotNull(key);
        assertNotNull(value);
        const keyData = this.toData(key);
        const valueData = this.toData(value);
        return this.putTransientInternal(keyData, valueData, ttl);
    }

    replace(key: K, newValue: V): Promise<V> {
        assertNotNull(key);
        assertNotNull(newValue);
        const keyData = this.toData(key);
        const newValueData = this.toData(newValue);
        return this.replaceInternal(keyData, newValueData);
    }

    replaceIfSame(key: K, oldValue: V, newValue: V): Promise<boolean> {
        assertNotNull(key);
        assertNotNull(oldValue);
        assertNotNull(newValue);
        const keyData = this.toData(key);
        const newValueData = this.toData(newValue);
        const oldValueData = this.toData(oldValue);
        return this.replaceIfSameInternal(keyData, oldValueData, newValueData);
    }

    set(key: K, value: V, ttl: number = -1): Promise<void> {
        assertNotNull(key);
        assertNotNull(value);
        const keyData = this.toData(key);
        const valueData = this.toData(value);
        return this.setInternal(keyData, valueData, ttl);
    }

    values(): Promise<ReadOnlyLazyList<V>> {
        return this.encodeInvokeOnRandomTarget<Data[]>(MapValuesCodec).then((valuesData) => {
            return new ReadOnlyLazyList(valuesData, this.client.getSerializationService());
        });
    }

    getEntryView(key: K): Promise<EntryView<K, V>> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey<EntryView<K, V>>(MapGetEntryViewCodec, keyData, keyData, 0);
    }

    addIndex(attribute: string, ordered: boolean): Promise<void> {
        return this.encodeInvokeOnRandomTarget<void>(MapAddIndexCodec, attribute, ordered);
    }

    tryLock(key: K, timeout: number = 0, lease: number = -1): Promise<boolean> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.encodeInvokeOnKey<boolean>(MapTryLockCodec, keyData, keyData, 0, lease, timeout, 0);
    }

    tryPut(key: K, value: V, timeout: number): Promise<boolean> {
        assertNotNull(key);
        assertNotNull(value);
        const keyData = this.toData(key);
        const valueData = this.toData(value);
        return this.tryPutInternal(keyData, valueData, timeout);
    }

    tryRemove(key: K, timeout: number): Promise<boolean> {
        assertNotNull(key);
        const keyData = this.toData(key);
        return this.tryRemoveInternal(keyData, timeout);
    }

    addEntryListener(listener: IMapListener<K, V>, key: K, includeValue: boolean = false): Promise<string> {
        return this.addEntryListenerInternal(listener, undefined, key, includeValue);
    }

    removeEntryListener(listenerId: string): Promise<boolean> {
        return this.client.getListenerService().deregisterListener(listenerId);
    }

    protected executeOnKeyInternal(keyData: Data, proData: Data): Promise<V> {
        return this.encodeInvokeOnKey<V>(MapExecuteOnKeyCodec, keyData, proData, keyData, 1);
    }

    protected containsKeyInternal(keyData: Data): Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(MapContainsKeyCodec, keyData, keyData, 0);
    }

    protected putInternal(keyData: Data, valueData: Data, ttl: number): Promise<V> {
        return this.encodeInvokeOnKey<V>(MapPutCodec, keyData, keyData, valueData, 0, ttl);
    }

    protected putAllInternal(partitionsToKeysData: { [id: string]: Array<[Data, Data]> }): Promise<void> {
        const partitionPromises: Array<Promise<void>> = [];
        for (const partition in partitionsToKeysData) {
            partitionPromises.push(
                this.encodeInvokeOnPartition<void>(MapPutAllCodec, Number(partition), partitionsToKeysData[partition]),
            );
        }
        return Promise.all(partitionPromises).then(function () {
            return;
        });
    }

    protected getInternal(keyData: Data): Promise<V> {
        return this.encodeInvokeOnKey<V>(MapGetCodec, keyData, keyData, 0);
    }

    protected removeInternal(keyData: Data, value: V = null): Promise<V> {
        if (value == null) {
            return this.encodeInvokeOnKey<V>(MapRemoveCodec, keyData, keyData, 0);
        } else {
            const valueData = this.toData(value);
            return this.encodeInvokeOnKey<V>(MapRemoveIfSameCodec, keyData, keyData, valueData, 0);
        }
    }

    protected getAllInternal(partitionsToKeys: { [id: string]: any }, result: any[] = []): Promise<Array<[Data, Data]>> {
        const partitionPromises: Array<Promise<Array<[Data, Data]>>> = [];
        for (const partition in partitionsToKeys) {
            partitionPromises.push(this.encodeInvokeOnPartition<Array<[Data, Data]>>(
                MapGetAllCodec,
                Number(partition),
                partitionsToKeys[partition]),
            );
        }
        const toObject = this.toObject.bind(this);
        const deserializeEntry = function (entry: [Data, Data]) {
            return [toObject(entry[0]), toObject(entry[1])];
        };
        return Promise.all(partitionPromises).then(function (serializedEntryArrayArray: Array<Array<[Data, Data]>>) {
            const serializedEntryArray = Array.prototype.concat.apply([], serializedEntryArrayArray);
            result.push(...(serializedEntryArray.map(deserializeEntry)));
            return serializedEntryArray;
        });
    }

    protected deleteInternal(keyData: Data): Promise<void> {
        return this.encodeInvokeOnKey<void>(MapDeleteCodec, keyData, keyData, 0);
    }

    protected evictInternal(keyData: Data): Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(MapEvictCodec, keyData, keyData, 0);
    }

    protected putIfAbsentInternal(keyData: Data, valueData: Data, ttl: number): Promise<V> {
        return this.encodeInvokeOnKey<V>(MapPutIfAbsentCodec, keyData, keyData, valueData, 0, ttl);
    }

    protected putTransientInternal(keyData: Data, valueData: Data, ttl: number): Promise<void> {
        return this.encodeInvokeOnKey<void>(MapPutTransientCodec, keyData, keyData, valueData, 0, ttl);
    }

    protected replaceInternal(keyData: Data, newValueData: Data): Promise<V> {
        return this.encodeInvokeOnKey<V>(MapReplaceCodec, keyData, keyData, newValueData, 0);
    }

    protected replaceIfSameInternal(keyData: Data, oldValueData: Data, newValueData: Data): Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(MapReplaceIfSameCodec, keyData, keyData, oldValueData, newValueData, 0);
    }

    protected setInternal(keyData: Data, valueData: Data, ttl: number): Promise<void> {
        return this.encodeInvokeOnKey<void>(MapSetCodec, keyData, keyData, valueData, 0, ttl);
    }

    protected tryPutInternal(keyData: Data, valueData: Data, timeout: number): Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(MapTryPutCodec, keyData, keyData, valueData, 0, timeout);
    }

    protected tryRemoveInternal(keyData: Data, timeout: number): Promise<boolean> {
        return this.encodeInvokeOnKey<boolean>(MapTryRemoveCodec, keyData, keyData, 0, timeout);
    }

    private addEntryListenerInternal(
        listener: IMapListener<K, V>, predicate: Predicate, key: K, includeValue: boolean,
    ): Promise<string> {
        let flags: any = null;
        const conversionTable: { [funcName: string]: EntryEventType } = {
            added: EntryEventType.ADDED,
            clearedAll: EntryEventType.CLEAR_ALL,
            evicted: EntryEventType.EVICTED,
            evictedAll: EntryEventType.EVICT_ALL,
            merged: EntryEventType.MERGED,
            removed: EntryEventType.REMOVED,
            updated: EntryEventType.UPDATED,
        };
        for (const funcName in conversionTable) {
            if (listener[funcName]) {
                /* tslint:disable:no-bitwise */
                flags = flags | conversionTable[funcName];
            }
        }
        const toObject = this.toObject.bind(this);
        const entryEventHandler = function (
            /* tslint:disable-next-line:no-shadowed-variable */
            key: K, val: V, oldVal: V, mergingVal: V, event: number, uuid: string, numberOfAffectedEntries: number,
        ) {
            let eventParams: any[] = [key, oldVal, val, mergingVal, numberOfAffectedEntries, uuid];
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
        let codec: ListenerMessageCodec;
        let listenerHandler: Function;
        if (key && predicate) {
            const keyData = this.toData(key);
            const predicateData = this.toData(predicate);
            codec = this.createEntryListenerToKeyWithPredicate(this.name, keyData, predicateData, includeValue, flags);
            listenerHandler = MapAddEntryListenerToKeyWithPredicateCodec.handle;
        } else if (key && !predicate) {
            const keyData = this.toData(key);
            codec = this.createEntryListenerToKey(this.name, keyData, includeValue, flags);
            listenerHandler = MapAddEntryListenerToKeyCodec.handle;
        } else if (!key && predicate) {
            const predicateData = this.toData(predicate);
            codec = this.createEntryListenerWithPredicate(this.name, predicateData, includeValue, flags);
            listenerHandler = MapAddEntryListenerWithPredicateCodec.handle;
        } else {
            codec = this.createEntryListener(this.name, includeValue, flags);
            listenerHandler = MapAddEntryListenerCodec.handle;
        }
        return this.client.getListenerService()
            .registerListener(codec, (m: ClientMessage) => {
                listenerHandler(m, entryEventHandler, toObject);
            });
    }

    private createEntryListenerToKey(name: string, keyData: Data, includeValue: boolean, flags: any): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return MapAddEntryListenerToKeyCodec.encodeRequest(name, keyData, includeValue, flags, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): string {
                return MapAddEntryListenerToKeyCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest(listenerId: string): ClientMessage {
                return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }

    private createEntryListenerToKeyWithPredicate(name: string, keyData: Data, predicateData: Data, includeValue: boolean,
                                                  flags: any): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return MapAddEntryListenerToKeyWithPredicateCodec.encodeRequest(name, keyData, predicateData, includeValue,
                    flags, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): string {
                return MapAddEntryListenerToKeyWithPredicateCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest(listenerId: string): ClientMessage {
                return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }

    private createEntryListenerWithPredicate(name: string, predicateData: Data, includeValue: boolean,
                                             flags: any): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return MapAddEntryListenerWithPredicateCodec.encodeRequest(name, predicateData, includeValue, flags, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): string {
                return MapAddEntryListenerWithPredicateCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest(listenerId: string): ClientMessage {
                return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }

    private createEntryListener(name: string, includeValue: boolean, flags: any): ListenerMessageCodec {
        return {
            encodeAddRequest(localOnly: boolean): ClientMessage {
                return MapAddEntryListenerCodec.encodeRequest(name, includeValue, flags, localOnly);
            },
            decodeAddResponse(msg: ClientMessage): string {
                return MapAddEntryListenerCodec.decodeResponse(msg).response;
            },
            encodeRemoveRequest(listenerId: string): ClientMessage {
                return MapRemoveEntryListenerCodec.encodeRequest(name, listenerId);
            },
        };
    }

    private checkNotPagingPredicate(v: Predicate): void {
        if (v instanceof PagingPredicate) {
            throw new RangeError('Paging predicate is not supported.');
        }
    }

}
