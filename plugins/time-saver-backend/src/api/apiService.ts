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
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { Knex } from 'knex';
import { DatabaseOperations } from '../database/databaseOperations';
import { ScaffolderClient } from './scaffolderClient';
import { ScaffolderDatabaseOperations } from '../database/scaffolderDatabaseOperations';

export interface TemplateSpecs {
  specs: {
    templateInfo: {
      entity: {
        metadata: {
          substitute: object;
        };
      };
    };
  };
}

export interface SampleMigrationClassificationConfigOptions {
  useScaffolderTasksEntries?: boolean;
}

const DEFAULT_SAMPLE_CLASSIFICATION = {
  engineering: {
    devops: 8,
    development_team: 8,
    security: 3,
  },
};

const DEFAULT_SAMPLE_TEMPLATES_TASKS = [
  'template:default/create-github-project',
  'template:default/create-nodejs-service',
  'template:default/create-golang-service',
];

export class TsApi {
  constructor(
    private readonly logger: LoggerService,
    private readonly config: RootConfigService,
    private readonly auth: AuthService,
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
    this.logger.debug(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getStatsByTeam(team: string) {
    const queryResult = await this.db.getStatsByTeam(team);
    const outputBody = {
      team: team,
      stats: queryResult,
    };
    this.logger.debug(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getStatsByTemplate(template: string) {
    const queryResult = await this.db.getStatsByTemplate(template);
    const outputBody = {
      template_name: template,
      stats: queryResult,
    };
    this.logger.debug(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getAllStats() {
    const queryResult = await this.db.getAllStats();
    const outputBody = {
      stats: queryResult,
    };
    this.logger.debug(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getGroupDivisionStats() {
    const queryResult = await this.db.getGroupSavingsDivision();
    const outputBody = {
      stats: queryResult,
    };
    this.logger.debug(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getDailyTimeSummariesTeamWise() {
    const queryResult = await this.db.getDailyTimeSummariesTeamWise();
    const outputBody = {
      stats: queryResult,
    };
    this.logger.debug(JSON.stringify(outputBody));
    return outputBody;
  }
  public async getDailyTimeSummariesTemplateWise() {
    const queryResult = await this.db.getDailyTimeSummariesTemplateWise();
    const outputBody = {
      stats: queryResult,
    };
    this.logger.debug(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getTimeSummarySavedTeamWise() {
    const queryResult = await this.db.getTimeSummarySavedTeamWise();
    const outputBody = {
      stats: queryResult,
    };
    this.logger.debug(JSON.stringify(outputBody));
    return outputBody;
  }
  public async getTimeSummarySavedTemplateWise() {
    const queryResult = await this.db.getTimeSummarySavedTemplateWise();
    const outputBody = {
      stats: queryResult,
    };
    this.logger.debug(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getSampleMigrationClassificationConfig(
    customClassificationRequest?: object,
    options?: SampleMigrationClassificationConfigOptions,
  ) {
    if (
      typeof customClassificationRequest === 'object' &&
      !Object.keys(customClassificationRequest).length
    ) {
      const errorMessage = `getSampleMigrationClassificationConfig : customClassificationRequest cannot be an empty object`;
      this.logger.error(
        `getSampleMigrationClassificationConfig : customClassificationRequest cannot be an empty object`,
      );
      return {
        status: 'FAIL',
        errorMessage,
      };
    }

    const sampleClassification =
      customClassificationRequest || DEFAULT_SAMPLE_CLASSIFICATION;
    const templatesList = options?.useScaffolderTasksEntries
      ? (await this.getAllTemplateTasks()).templateTasks
      : DEFAULT_SAMPLE_TEMPLATES_TASKS;
    this.logger.debug(
      `Generating sample classification configuration with ${
        options?.useScaffolderTasksEntries ? 'scaffolder DB' : 'user-defined'
      } templates tasks list and ${
        customClassificationRequest ? 'user-defined' : 'default'
      } classification`,
    );
    return {
      status: 'OK',
      data: templatesList.map(t => ({
        entityRef: t,
        ...sampleClassification,
      })),
    };
  }

  public async updateTemplatesWithSubstituteData(
    requestData?: string,
  ): Promise<{
    status: string;
    message?: string;
    migrationStatisticsReport?: object;
    error?: Error;
  }> {
    let templateClassification: [];
    let migrationStatisticsReport: {
      updatedTemplates: {
        total: number;
        list: string[];
      };
      missingTemplates: {
        total: number;
        list: string[];
      };
    } = {
      updatedTemplates: {
        total: 0,
        list: [],
      },
      missingTemplates: {
        total: 0,
        list: [],
      },
    };
    if (requestData) {
      try {
        if (typeof requestData !== 'object') {
          templateClassification = JSON.parse(requestData);
        } else {
          templateClassification = requestData;
        }

        if (
          !templateClassification ||
          !Object.keys(templateClassification).length
        ) {
          throw new Error(
            `Invalid classification ${JSON.stringify(
              requestData,
            )}. Either it was empty or could not parse JSON string. Aborting...`,
          );
        }
        this.logger.debug(
          `Found classification in API POST body: ${JSON.stringify(
            templateClassification,
          )}`,
        );
      } catch (error) {
        const msg = `Migration: Could not parse JSON object from POST call body "${JSON.stringify(
          requestData,
        )}", aborting...`;
        this.logger.error(msg, error);
        return {
          status: 'FAIL',
          message: `${msg} - ${error}`,
        };
      }
    } else {
      const tsConfigObj =
        this.config.getOptionalString('ts.backward.config') || undefined;
      if (!tsConfigObj) {
        const errorMessage =
          'Migration: Could not find backward migration configuration in app-config.x.yaml, aborting...';
        this.logger.error(errorMessage);
        return {
          status: 'FAIL',
          message: errorMessage,
        };
      }

      try {
        templateClassification = JSON.parse(String(tsConfigObj));
        this.logger.debug(
          `Found classification in app-config.x.yaml: ${JSON.stringify(
            templateClassification,
          )}`,
        );
      } catch (error) {
        const msg =
          'Migration: Could not parse backward migration configuration as JSON object from app-config.x.yaml, aborting...';
        this.logger.error(msg, error);
        return {
          status: 'FAIL',
          message: `${msg} - ${error}`,
        };
      }
    }

    try {
      interface ClassificationMigrationEntry {
        entityRef?: number;
        [key: string]: unknown;
      }

      this.logger.info(`Starting backward migration`);
      const taskTemplateList = await new ScaffolderClient(
        this.logger,
        this.config,
        this.auth,
      ).fetchTemplatesFromScaffolder();
      for (let i = 0; i < taskTemplateList.length; i++) {
        const scaffolderTaskRecord = taskTemplateList[i];
        this.logger.debug(
          `Migrating template ${JSON.stringify(scaffolderTaskRecord)}`,
        );
        const { entityRef: templateEntityRef } =
          scaffolderTaskRecord.spec.templateInfo;
        this.logger.debug(
          `Found template with entityRef: ${templateEntityRef}`,
        );
        const classificationEntry = templateClassification.find(
          (con: { entityRef: string | undefined }) =>
            con.entityRef === templateEntityRef,
        );

        if (classificationEntry) {
          //  Delete entityRef
          const newClassificationEntry = Object.assign(
            {},
            classificationEntry as ClassificationMigrationEntry,
          );
          delete newClassificationEntry.entityRef;

          const newTemplateTaskRecordSpecs = {
            ...scaffolderTaskRecord.spec,
            templateInfo: {
              ...scaffolderTaskRecord.spec.templateInfo,
              entity: {
                ...scaffolderTaskRecord.spec.templateInfo.entity,
                metadata: {
                  ...scaffolderTaskRecord.spec.templateInfo.entity.metadata,
                  substitute: newClassificationEntry,
                },
              },
            },
          };

          const patchQueryResult =
            await this.scaffolderDb.updateTemplateTaskById(
              scaffolderTaskRecord.id,
              JSON.stringify(newTemplateTaskRecordSpecs),
            );

          if (patchQueryResult) {
            migrationStatisticsReport = {
              ...migrationStatisticsReport,
              updatedTemplates: {
                total: ++migrationStatisticsReport.updatedTemplates.total,
                list: [
                  ...migrationStatisticsReport.updatedTemplates.list,
                  scaffolderTaskRecord.id,
                ],
              },
            };
            this.logger.debug(
              `scaffolderTaskRecord with id ${scaffolderTaskRecord.id} was patched`,
            );
          }
        } else {
          migrationStatisticsReport = {
            ...migrationStatisticsReport,
            missingTemplates: {
              total: ++migrationStatisticsReport.missingTemplates.total,
              list: [
                ...migrationStatisticsReport.missingTemplates.list,
                scaffolderTaskRecord.id,
              ],
            },
          };
          this.logger.debug(
            `scaffolderTaskRecord with id ${scaffolderTaskRecord.id} was not found in scaffolder DB`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Could not continue with backward migration, aborting...`,
        error,
      );
      return {
        status: 'error',
        error: error as Error,
      };
    }
    return {
      status: 'SUCCESS',
      migrationStatisticsReport,
    };
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
    this.logger.debug(JSON.stringify(outputBody));
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
    this.logger.debug(JSON.stringify(outputBody));
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
    this.logger.debug(JSON.stringify(outputBody));
    return outputBody;
  }

  public async getTemplateCount() {
    const queryResult = (await this.db.getTemplateCount())[0];

    const outputBody = {
      templateTasks: parseInt(queryResult.count, 10),
    };
    this.logger.debug(JSON.stringify(outputBody));
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
    this.logger.debug(JSON.stringify(outputBody));
    return outputBody;
  }
}
