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
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { TimeSaverStore } from '../database/TimeSaverDatabase';
import { ScaffolderClient } from '../api/scaffolderClient';
import { dateTimeFromIsoDate } from '../utils';

export class TimeSaverHandler {
  constructor(
    private readonly auth: AuthService,
    private readonly logger: LoggerService,
    private readonly discovery: DiscoveryService,
    private readonly db: TimeSaverStore,
  ) {}

  async fetchTemplates() {
    const scaffolderClient = new ScaffolderClient(
      this.auth,
      this.logger,
      this.discovery,
    );
    this.logger.info(`START - Collecting Time Savings data from templates...}`);

    let templateTaskList = [];
    try {
      templateTaskList = await scaffolderClient.fetchTemplatesFromScaffolder();
    } catch (error) {
      return 'FAIL';
    }

    this.logger.debug('Truncating database');
    await this.db.truncate(); // cleaning table
    this.logger.debug(
      `Template task list: ${JSON.stringify(templateTaskList)}`,
    );
    templateTaskList = templateTaskList.filter(
      (single: { status: string }) => single.status === 'completed',
    ); // filtering only completed
    for (let i = 0; i < templateTaskList.length; i++) {
      const singleTemplate = templateTaskList[i];
      this.logger.debug(`Parsing template task ${singleTemplate.id}`);
      const templateSubstituteData =
        singleTemplate.spec.templateInfo.entity.metadata.substitute ||
        undefined;
      if (templateSubstituteData) {
        for (const key in templateSubstituteData.engineering) {
          if (
            Object.prototype.hasOwnProperty.call(
              templateSubstituteData.engineering,
              key,
            )
          ) {
            const value = templateSubstituteData.engineering[key];
            const createdAt = dateTimeFromIsoDate(singleTemplate.createdAt);

            if (!createdAt) {
              this.logger.error(
                `Found invalid date when parsing catalog DB. ${JSON.stringify(
                  singleTemplate,
                )}`,
              );
            }

            await this.db.insert({
              team: key,
              role: '',
              timeSaved: value,
              createdAt,
              createdBy: singleTemplate.createdBy,
              templateName: singleTemplate.spec.templateInfo.entityRef,
              templateTaskStatus: singleTemplate.status,
              templateTaskId: singleTemplate.id,
            });
          }
        }
      } else {
        this.logger.debug(
          `Template ${singleTemplate.id} does not have substitute fields on its body`,
        );
      }
    }
    this.logger.info(`STOP - Collecting Time Savings data from templates...}`);
    return 'SUCCESS';
  }
}
