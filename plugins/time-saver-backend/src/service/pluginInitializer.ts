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
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import { TimeSaverHandler } from '../timeSaver/handler';
import { TimeSaverApi } from '../api/timeSaverApi';
import { ScaffolderDatabase } from '../database/ScaffolderDatabase';
import { TimeSaverDatabase } from '../database/TimeSaverDatabase';
import { TsScheduler } from '../timeSaver/scheduler';
import { setupCommonRoutes } from './commonRouter';
import { Router } from 'express';
import { PluginTaskScheduler } from '@backstage/backend-tasks';

interface PluginDependencies {
  auth: AuthService;
  router: Router;
  logger: LoggerService;
  config: RootConfigService;
  database: DatabaseService;
  discovery: DiscoveryService;
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
    seconds: 30,
  },
};

export class PluginInitializer {
  private auth!: AuthService;
  private router!: Router;
  private logger!: LoggerService;
  private config!: RootConfigService;
  private database!: DatabaseService;
  private discovery!: DiscoveryService;
  private scheduler!: PluginTaskScheduler;
  private tsHandler!: TimeSaverHandler;
  private apiHandler!: TimeSaverApi;
  private tsScheduler!: TsScheduler;

  private constructor(
    auth: AuthService,
    router: Router,
    logger: LoggerService,
    config: RootConfigService,
    database: DatabaseService,
    discovery: DiscoveryService,
    scheduler: PluginTaskScheduler,
  ) {
    this.auth = auth;
    this.router = router;
    this.logger = logger;
    this.config = config;
    this.database = database;
    this.discovery = discovery;
    this.scheduler = scheduler;
  }

  static async builder(
    auth: AuthService,
    router: Router,
    logger: LoggerService,
    config: RootConfigService,
    database: DatabaseService,
    discovery: DiscoveryService,
    scheduler: PluginTaskScheduler,
  ): Promise<PluginInitializer> {
    const instance = new PluginInitializer(
      auth,
      router,
      logger,
      config,
      database,
      discovery,
      scheduler,
    );
    await instance.initialize();
    return instance;
  }

  private async initialize() {
    // Initialize logger, config, database and scheduler
    this.auth = this.dependencies.auth;
    this.logger = this.dependencies.logger;
    this.config = this.dependencies.config;
    this.database = this.dependencies.database;
    this.discovery = this.dependencies.discovery;
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
      this.auth,
      this.logger,
      this.discovery,
      timeSaverDbInstance,
    );
    this.apiHandler = new TimeSaverApi(
      this.auth,
      this.logger,
      this.config,
      this.discovery,
      timeSaverDbInstance,
      scaffolderDbInstance,
    );
    this.tsScheduler = new TsScheduler(
      this.auth,
      this.logger,
      this.discovery,
      timeSaverDbInstance,
    );

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
      !this.auth ||
      !this.router ||
      !this.logger ||
      !this.config ||
      !this.database ||
      !this.discovery ||
      !this.scheduler
    ) {
      throw new Error('PluginInitializer not properly initialized');
    }
    return {
      auth: this.auth,
      router: this.router,
      logger: this.logger,
      config: this.config,
      database: this.database,
      discovery: this.discovery,
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
