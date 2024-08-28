/*
 * Copyright 2024 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  AuthService,
  LoggerService,
  DiscoveryService,
} from '@backstage/backend-plugin-api';

export class ScaffolderClient {
  constructor(
    private readonly auth: AuthService,
    private readonly logger: LoggerService,
    private readonly discovery: DiscoveryService,
  ) {}

  async fetchTemplatesFromScaffolder() {
    const baseUrl = await this.discovery.getBaseUrl('scaffolder');
    const scaffolderUri = '/v2/tasks';
    const callUrl = `${baseUrl}${scaffolderUri}`;

    const { token } = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'scaffolder',
    });

    let templateTaskList = [];
    try {
      const response = await fetch(callUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      this.logger.debug(
        `Successful call to scaffolder backend. Data:${JSON.stringify(data)}`,
      );
      if (Object.hasOwn(data, 'error')) {
        this.logger.error(`Problem retrieving scaffolder tasks`, data.error);
        return [];
      } else if (!Object.hasOwn(data, 'tasks')) {
        this.logger.error(`Tasks key not found in scaffolder tasks call`);
        return [];
      }
      templateTaskList = data.tasks;
    } catch (error) {
      this.logger.error(
        `Problem retrieving response from url: ${callUrl}`,
        error ? (error as Error) : undefined,
      );
      return [];
    }
    return templateTaskList;
  }
}
