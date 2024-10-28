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
  DatabaseService,
  RootConfigService,
  SchedulerService,
  SchedulerServiceTaskScheduleDefinition,
  readSchedulerServiceTaskScheduleDefinitionFromConfig,
} from '@backstage/backend-plugin-api';
import { TimeSaverHandler } from '../timeSaver/handler';
import { TimeSaverApi } from '../api/timeSaverApi';
import { ScaffolderDatabase } from '../database/ScaffolderDatabase';
import { TimeSaverDatabase } from '../database/TimeSaverDatabase';
import { TsScheduler } from '../timeSaver/scheduler';
import { setupCommonRoutes } from './commonRouter';
import { Router } from 'express';

interface PluginDependencies {
  router: Router;
  logger: LoggerService;
  config: RootConfigService;
  auth: AuthService;
  database: DatabaseService;
  scheduler: SchedulerService;
}

const TS_PLUGIN_DEFAULT_SCHEDULE: SchedulerServiceTaskScheduleDefinition = {
  frequency: {
    minutes: 5,
  },
  timeout: {
    minutes: 30,
  },
  initialDelay: {
    seconds: 30,
  },
};

export class PluginInitializer {
  private logger!: LoggerService;
  private config!: RootConfigService;
  private auth!: AuthService;
  private scheduler!: SchedulerService;
  private database!: DatabaseService;
  private tsHandler!: TimeSaverHandler;
  private apiHandler!: TimeSaverApi;
  private tsScheduler!: TsScheduler;
  private router!: Router;

  private constructor(
    router: Router,
    logger: LoggerService,
    config: RootConfigService,
    auth: AuthService,
    database: DatabaseService,
    scheduler: SchedulerService,
  ) {
    this.router = router;
    this.logger = logger;
    this.config = config;
    this.auth = auth;
    this.database = database;
    this.scheduler = scheduler;
  }

  static async builder(
    router: Router,
    logger: LoggerService,
    config: RootConfigService,
    auth: AuthService,
    database: DatabaseService,
    scheduler: SchedulerService,
  ): Promise<PluginInitializer> {
    const instance = new PluginInitializer(
      router,
      logger,
      config,
      auth,
      database,
      scheduler,
    );
    await instance.initialize();
    return instance;
  }

  private async initialize() {
    // Initialize logger, config, database and scheduler
    this.logger = this.dependencies.logger;
    this.config = this.dependencies.config;
    this.auth = this.dependencies.auth;
    this.database = this.dependencies.database;
    this.scheduler = this.dependencies.scheduler;

    // Initialize TsDatabase and run migrations

    const timeSaverDbInstance = await TimeSaverDatabase.create(
      this.database,
      this.logger,
    );
    const scaffolderDbInstance = await ScaffolderDatabase.create(
      this.config,
      this.logger,
    );

    // Initialize handlers
    this.tsHandler = new TimeSaverHandler(
      this.logger,
      this.config,
      this.auth,
      timeSaverDbInstance,
    );
    this.apiHandler = new TimeSaverApi(
      this.logger,
      this.config,
      this.auth,
      timeSaverDbInstance,
      scaffolderDbInstance,
    );
    this.tsScheduler = new TsScheduler(
      this.logger,
      this.config,
      this.auth,
      timeSaverDbInstance,
    );

    // Scheduler
    let taskDefinition: SchedulerServiceTaskScheduleDefinition =
      TS_PLUGIN_DEFAULT_SCHEDULE;
    const configurableSchedule = this.config.getOptionalConfig(
      'ts.scheduler.handler',
    );
    if (configurableSchedule) {
      taskDefinition =
        readSchedulerServiceTaskScheduleDefinitionFromConfig(
          configurableSchedule,
        );
    }

    taskDefinition = {
      ...taskDefinition,
      scope: taskDefinition.scope || 'global', // setting global flag on scope - scheduler will attempt to ensure that only one worker machine runs the task at a time,
    };

    const taskRunner = this.scheduler.createScheduledTaskRunner(taskDefinition);
    this.tsScheduler.schedule(taskRunner);

    // registering routes
    this.router = setupCommonRoutes(
      this.router,
      this.logger,
      this.tsHandler,
      this.tsApi,
    );
  }

  private get dependencies(): PluginDependencies {
    if (
      !this.router ||
      !this.logger ||
      !this.config ||
      !this.auth ||
      !this.database ||
      !this.scheduler
    ) {
      throw new Error('PluginInitializer not properly initialized');
    }
    return {
      router: this.router,
      logger: this.logger,
      config: this.config,
      auth: this.auth,
      database: this.database,
      scheduler: this.scheduler,
    };
  }

  get timeSaverHandler(): TimeSaverHandler {
    return this.tsHandler;
  }

  get tsApi(): TimeSaverApi {
    return this.apiHandler;
  }

  get timeSaverScheduler(): TsScheduler {
    return this.tsScheduler;
  }

  get timeSaverRouter(): Router {
    return this.router;
  }
}
