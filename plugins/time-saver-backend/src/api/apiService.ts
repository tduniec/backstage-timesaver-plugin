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
import { ScaffolderClient } from './scaffolderClient';
import { Config } from '@backstage/config';
import { ScaffolderDatabaseOperations } from '../database/scaffolderDatabaseOperations';

export class TsApi {
  constructor(
    private readonly logger: Logger,
    private readonly config: Config,
    knex: Knex,
    scaffoldKx: Knex,
  ) {
    this.db = new DatabaseOperations(knex, logger);
    this.scaffolderDb = new ScaffolderDatabaseOperations(scaffoldKx, logger);
  }
  private readonly db: DatabaseOperations;
  private readonly scaffolderDb: ScaffolderDatabaseOperations;
  private readonly tsTableName = 'ts_template_time_savings';

  public async getStatsByTemplateTaskId(templateTaskId: string) {
    const templateName = await this.db.getTemplateNameByTsId(templateTaskId);
    const queryResult = await this.db.getStatsByTemplateTaskId(templateTaskId);
    const outputBody = {
      templateTaskId: templateTaskId,
      templateName: templateName,
      stats: queryResult,
    };
    this.logger.info(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getStatsByTeam(team: string) {
    const queryResult = await this.db.getStatsByTeam(team);
    const outputBody = {
      team: team,
      stats: queryResult,
    };
    this.logger.info(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getStatsByTemplate(template: string) {
    const queryResult = await this.db.getStatsByTemplate(template);
    const outputBody = {
      template_name: template,
      stats: queryResult,
    };
    this.logger.info(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getAllStats() {
    const queryResult = await this.db.getAllStats();
    const outputBody = {
      stats: queryResult,
    };
    this.logger.info(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getGroupDivisionStats() {
    const queryResult = await this.db.getGroupSavingsDivision();
    const outputBody = {
      stats: queryResult,
    };
    this.logger.info(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getDailyTimeSummariesTeamWise() {
    const queryResult = await this.db.getDailyTimeSummariesTeamWise();
    const outputBody = {
      stats: queryResult,
    };
    this.logger.info(JSON.stringify(outputBody));
    return outputBody;
  }
  public async getDailyTimeSummariesTemplateWise() {
    const queryResult = await this.db.getDailyTimeSummariesTemplateWise();
    const outputBody = {
      stats: queryResult,
    };
    this.logger.info(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getTimeSummarySavedTeamWise() {
    const queryResult = await this.db.getTimeSummarySavedTeamWise();
    const outputBody = {
      stats: queryResult,
    };
    this.logger.info(JSON.stringify(outputBody));
    return outputBody;
  }
  public async getTimeSummarySavedTemplateWise() {
    const queryResult = await this.db.getTimeSummarySavedTemplateWise();
    const outputBody = {
      stats: queryResult,
    };
    this.logger.info(JSON.stringify(outputBody));
    return outputBody;
  }

  public async updateTemplatesWithSubstituteData(): Promise<{
    status: string;
    message?: string;
    error?: Error;
  }> {
    const tsConfigObj =
      this.config.getOptionalString('ts.backward.config') || undefined;
    if (!tsConfigObj) {
      this.logger.warn(`Backward processing not configured, escaping...`);
      return {
        status: 'FAIL',
        message: 'Backward processing not configured in app-config.yaml file',
      };
    }
    try {
      this.logger.info(`Starting backward template savings migration`);
      const tsConfig = JSON.parse(String(tsConfigObj));
      const taskTemplateList = await new ScaffolderClient(
        this.logger,
        this.config,
      ).fetchTemplatesFromScaffolder();
      for (let i = 0; i < taskTemplateList.length; i++) {
        const singleTemplate = taskTemplateList[i];
        this.logger.debug(singleTemplate);
        const templateReference = singleTemplate.spec.templateInfo.entityRef;
        const substituteConfig = tsConfig.find(
          (con: { entityRef: unknown }) => con.entityRef === templateReference,
        );
        // TODO : Define / create entityRef type
        if (substituteConfig) {
          await this.updateExistingTemplateWithSubstituteById(
            singleTemplate.id,
            substituteConfig,
          );
        }
      }
    } catch (error) {
      this.logger.error(`problem with template backward migration`, error);
      return {
        status: 'error',
        error: error as Error,
      };
    }
    return {
      status: 'SUCCESS',
    };
  }

  public async updateExistingTemplateWithSubstituteById(
    templateTaskId: string,
    engData: object,
  ) {
    const queryResult = JSON.parse(
      (await this.scaffolderDb.collectSpecByTemplateId(templateTaskId)).spec,
    );
    const metadata = queryResult.templateInfo.entity.metadata;
    metadata.substitute = engData;

    await this.scaffolderDb.updateTemplateTaskById(
      templateTaskId,
      JSON.stringify(queryResult),
    );
    const outputBody = {
      stats: queryResult,
    };
    this.logger.debug(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getAllGroups() {
    const queryResult = await this.db.getDistinctColumn(
      this.tsTableName,
      'team',
    );
    const groupList: string[] = queryResult.map(row => row.team);
    const outputBody = {
      groups: groupList,
    };
    this.logger.info(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getAllTemplateNames() {
    const queryResult = await this.db.getDistinctColumn(
      this.tsTableName,
      'template_name',
    );
    const groupList: string[] = queryResult.map(row => row.template_name);
    const outputBody = {
      templates: groupList,
    };
    this.logger.info(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getAllTemplateTasks() {
    const queryResult = await this.db.getDistinctColumn(
      this.tsTableName,
      'template_task_id',
    );
    const groupList: string[] = queryResult.map(row => row.template_task_id);
    const outputBody = {
      templateTasks: groupList,
    };
    this.logger.info(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getTemplateCount() {
    const queryResult = (await this.db.getTemplateCount())[0];

    const outputBody = {
      templateTasks: parseInt(queryResult.count, 10),
    };
    this.logger.info(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getTimeSavedSum(divider?: number) {
    const dividerInt = divider ?? 1;
    const queryResult = (
      await this.db.getTimeSavedSum(this.tsTableName, 'time_saved')
    )[0];
    const outputBody = {
      timeSaved: queryResult.sum / dividerInt,
    };
    this.logger.info(JSON.stringify(outputBody));
    return outputBody;
  }
}
