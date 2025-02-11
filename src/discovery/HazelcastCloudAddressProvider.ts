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

import {LoggingService} from '../logging/LoggingService';
import {HazelcastCloudDiscovery} from './HazelcastCloudDiscovery';
import {AddressProvider} from '../connection/AddressProvider';
import * as Promise from 'bluebird';

export class HazelcastCloudAddressProvider implements AddressProvider {
    private readonly loggingService: LoggingService;
    private readonly cloudDiscovery: HazelcastCloudDiscovery;

    constructor(endpointUrl: string, connectionTimeoutMillis: number, loggingService: LoggingService) {
        this.cloudDiscovery = new HazelcastCloudDiscovery(endpointUrl, connectionTimeoutMillis);
        this.loggingService = loggingService;
    }

    loadAddresses(): Promise<string[]> {
        return this.cloudDiscovery.discoverNodes().then((res) => {
            return Array.from(res.keys());
        }).catch((e) => {
            this.loggingService.warn('HazelcastCloudAddressProvider',
                'Failed to load addresses from hazelcast.cloud : ' + e.message);
            return [];
        });
    }
}
