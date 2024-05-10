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
import { Config } from '@backstage/config';
import { PluginDatabaseManager } from '@backstage/backend-common';
import { TimeSaverHandler } from '../timeSaver/handler';
import { TsApi } from '../api/apiService';
import { TsDatabase } from '../database/tsDatabase';
import { ScaffolderDb } from '../database/scaffolderDb';
import { TsScheduler } from '../timeSaver/scheduler';
import { setupCommonRoutes } from './commonRouter';
import { Router } from 'express';
import { PluginTaskScheduler } from '@backstage/backend-tasks';

interface PluginDependencies {
  router: Router;
  logger: Logger;
  config: Config;
  database: PluginDatabaseManager;
  scheduler: PluginTaskScheduler;
}

const TS_PLUGIN_DEFAULT_SCHEDULE = {
  frequency: {
    minutes: 5,
  },
  timeout: {
    minutes: 30,
  },
  initialDelay: {
    seconds: 60,
  },
};

export class PluginInitializer {
  private logger!: Logger;
  private config!: Config;
  private scheduler!: PluginTaskScheduler;
  private database!: PluginDatabaseManager;
  private tsHandler!: TimeSaverHandler;
  private apiHandler!: TsApi;
  private tsScheduler!: TsScheduler;
  private router!: Router;

  private constructor(
    router: Router,
    logger: Logger,
    config: Config,
    database: PluginDatabaseManager,
    scheduler: PluginTaskScheduler,
  ) {
    this.router = router;
    this.logger = logger;
    this.config = config;
    this.database = database;
    this.scheduler = scheduler;
  }

  static async builder(
    router: Router,
    logger: Logger,
    config: Config,
    database: PluginDatabaseManager,
    scheduler: PluginTaskScheduler,
  ): Promise<PluginInitializer> {
    const instance = new PluginInitializer(
      router,
      logger,
      config,
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
    this.database = this.dependencies.database;
    this.scheduler = this.dependencies.scheduler;

    // Initialize TsDatabase and run migrations
    const tsDatabaseInstance = TsDatabase.create(this.database);
    const kx = await tsDatabaseInstance.get();
    await TsDatabase.runMigrations(kx);

    // Initialize ScaffolderDb
    const scaffolderDbKx = new ScaffolderDb(this.config).scaffolderKnex();
    if (!scaffolderDbKx) {
      this.logger.error('Could not get scaffolder database info');
      throw new Error('Could not get scaffolder database info');
    }

    // Initialize handlers
    this.tsHandler = new TimeSaverHandler(this.logger, this.config, kx);
    this.apiHandler = new TsApi(this.logger, this.config, kx, scaffolderDbKx);
    this.tsScheduler = new TsScheduler(this.logger, this.config, kx);

    // Scheduler
    const taskRunner = this.scheduler.createScheduledTaskRunner(
      TS_PLUGIN_DEFAULT_SCHEDULE,
    );
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
      !this.database ||
      !this.scheduler
    ) {
      throw new Error('PluginInitializer not properly initialized');
    }
    return {
      router: this.router,
      logger: this.logger,
      config: this.config,
      database: this.database,
      scheduler: this.scheduler,
    };
  }

  get timeSaverHandler(): TimeSaverHandler {
    return this.tsHandler;
  }

  get tsApi(): TsApi {
    return this.apiHandler;
  }

  get timeSaverScheduler(): TsScheduler {
    return this.tsScheduler;
  }

  get timeSaverRouter(): Router {
    return this.router;
  }
}
