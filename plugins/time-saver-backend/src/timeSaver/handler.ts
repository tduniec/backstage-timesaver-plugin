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
import { Logger } from 'winston';
import { Knex } from 'knex';
import { DatabaseOperations } from '../database/databaseOperations';
import { ScaffolderClient } from '../api/scaffolderClient';
import { Config } from '@backstage/config';

export class TimeSaverHandler {
  constructor(
    private readonly logger: Logger,
    private readonly config: Config,
    knex: Knex,
  ) {
    this.db = new DatabaseOperations(knex, logger);
    this.globalTeam = this.config.getString('ts.globalTeam') ?? 'Global';
  }
  private readonly db: DatabaseOperations;
  private readonly tsTableName = 'ts_template_time_savings';
  private readonly globalTeam: string;

  async fetchTemplates() {
    const scaffolderClient = new ScaffolderClient(this.logger, this.config);
    this.logger.info(`START - Collecting Time Savings data from templates...}`);

    let templateTaskList = [];
    try {
      templateTaskList = await scaffolderClient.fetchTemplatesFromScaffolder();
    } catch (error) {
      return 'FAIL';
    }

    await this.db.truncate(this.tsTableName); // cleaning table
    templateTaskList = templateTaskList.filter(
      (single: { status: string }) => single.status === 'completed',
    ); // filtering only completed
    for (let i = 0; i < templateTaskList.length; i++) {
      const singleTemplate = templateTaskList[i];
      const createdAtForPostgres = new Date(singleTemplate.createdAt)
        .toISOString()
        .replace('T', ' ')
        .replace('Z', ' UTC');
      this.logger.info(`Parsing template task ${singleTemplate.id}`);
      let templateSubstituteData =
        singleTemplate.spec.templateInfo.entity.metadata.substitute ||
        undefined;
      //  Skip entityRef key
      templateSubstituteData = Object.fromEntries(
        Object.entries(templateSubstituteData).filter(e => e[0] !== 'entityRef')
      );

      const createTemplateStats = async ({ team, role, timeSaved }: { team: string, role: string, timeSaved: number }) =>
        await this.db.insert(this.tsTableName, {
          template_task_id: singleTemplate.id,
          created_at: createdAtForPostgres,
          template_name: singleTemplate.spec.templateInfo.entityRef,
          team: team,
          role: role,
          time_saved: timeSaved,
          template_task_status: singleTemplate.status,
          created_by: singleTemplate.createdBy,
        });

      if (templateSubstituteData) {
        // Check if it's nested
        let role: string = '';
        let nesting_levels: number = 0;
        for (const team in templateSubstituteData) {
          //  Check if is object
          if (typeof templateSubstituteData[team] === 'object' && templateSubstituteData[team] !== null) {
            // 2 level classification
            if (nesting_levels && nesting_levels !== 2) {
              this.logger.error(`Different nesting levels found. Started with 2 levels, then 1 level was found: ${JSON.stringify(templateSubstituteData)}`);
              break;
            }
            nesting_levels = 2;

            Object.entries(templateSubstituteData[team]).forEach(async ([roleName, roleTimeSaved]) => {
              const timeSaved = parseInt(roleTimeSaved as string, 10);
              if (typeof timeSaved !== 'number') {
                this.logger.error(`Wrong value type found in annotation: ${roleTimeSaved}`);
              }
              await createTemplateStats({ team, role: roleName, timeSaved });
            });
          } else if (typeof templateSubstituteData[team] === 'number') {
            // 1 level classification
            if (nesting_levels && nesting_levels !== 1) {
              this.logger.error(`Different nesting levels found. Started with 1 level, then 2 levels were found: ${JSON.stringify(templateSubstituteData)}`);
              break;
            }
            nesting_levels = 1;

            const timeSaved = templateSubstituteData[team];
            role = team;
            await createTemplateStats({ team: this.globalTeam, role, timeSaved });
          } else {
            this.logger.error(`Malformed team/role structure ${JSON.stringify(templateSubstituteData)}`);
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
