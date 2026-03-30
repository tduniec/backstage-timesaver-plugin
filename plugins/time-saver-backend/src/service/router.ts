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
  LifecycleService,
  LoggerService,
  RootConfigService,
  SchedulerService,
  coreServices,
  createBackendPlugin,
  DiscoveryService,
  UrlReaderService,
  HttpAuthService,
  DatabaseService,
} from '@backstage/backend-plugin-api';
import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import express from 'express';
import Router from 'express-promise-router';
import { PluginInitializer } from './pluginInitializer';

export interface RouterOptions {
  logger: LoggerService;
  config: RootConfigService;
  discovery: DiscoveryService;
  database: DatabaseService;
  scheduler: SchedulerService;
  urlReader: UrlReaderService;
  lifecycle: LifecycleService;
  auth: AuthService;
  httpAuth?: HttpAuthService;
}

function registerRouter() {
  const router = Router();
  router.use(express.json());
  return router;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config, database, scheduler, lifecycle, auth } = options;
  const baseRouter = registerRouter();
  const plugin = await PluginInitializer.builder(
    baseRouter,
    logger,
    config,
    auth,
    database,
    scheduler,
    lifecycle,
  );
  const router = plugin.timeSaverRouter;
  router.use(MiddlewareFactory.create({ config, logger }).error);
  return router;
}

export const timeSaverPlugin = createBackendPlugin({
  pluginId: 'time-saver',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        auth: coreServices.auth,
        scheduler: coreServices.scheduler,
        database: coreServices.database,
        httpRouter: coreServices.httpRouter,
        urlReader: coreServices.urlReader,
        lifecycle: coreServices.lifecycle,
      },
      async init({
        auth,
        config,
        logger,
        scheduler,
        database,
        httpRouter,
        lifecycle,
      }) {
        const baseRouter = registerRouter();
        const plugin = await PluginInitializer.builder(
          baseRouter,
          logger,
          config,
          auth,
          database,
          scheduler,
          lifecycle,
        );
        const router = plugin.timeSaverRouter;
        httpRouter.use(router);

        httpRouter.addAuthPolicy({
          path: '/migrate',
          allow: 'unauthenticated',
        });

        httpRouter.addAuthPolicy({
          path: '/generate-sample-classification',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
