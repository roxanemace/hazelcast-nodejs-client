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

import Address = require('./Address');
import TopicOverloadPolicy = require('./proxy/topic/TopicOverloadPolicy');
import * as Aggregators from './aggregation/Aggregators';
import {ClientInfo} from './ClientInfo';
import * as Config from './config/Config';
import {ImportConfig} from './config/ImportConfig';
import * as Predicates from './core/Predicate';
import {IterationType} from './core/Predicate';
import HazelcastClient from './HazelcastClient';
import * as HazelcastErrors from './HazelcastError';
import {IMap} from './proxy/IMap';
import {ReadResultSet} from './proxy/ringbuffer/ReadResultSet';
import {ClassDefinitionBuilder} from './serialization/portable/ClassDefinitionBuilder';
import {ClassDefinition} from './serialization/portable/ClassDefinition';
import {FieldDefinition} from './serialization/portable/ClassDefinition';

export {
    HazelcastClient as Client,
    Config,
    ClientInfo,
    IMap,
    Address,
    Predicates,
    TopicOverloadPolicy,
    HazelcastErrors,
    ReadResultSet,
    IterationType,
    Aggregators,
    ImportConfig,
    FieldDefinition,
    ClassDefinition,
    ClassDefinitionBuilder,
};
