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
  DatabaseManager,
  getVoidLogger,
  HostDiscovery,
} from '@backstage/backend-common';
import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { ConfigReader } from '@backstage/config';
import {
  PluginTaskScheduler,
  TaskInvocationDefinition,
  TaskRunner,
} from '@backstage/backend-tasks';

describe('createRouter', () => {
  let app: express.Express;
  const manager = DatabaseManager.fromConfig(
    new ConfigReader({
      backend: {
        database: { client: 'better-sqlite3', connection: ':memory:' },
      },
    }),
  );
  const config = new ConfigReader({
    backend: {
      baseUrl: 'http://127.0.0.1',
      listen: { port: 7007 },
      database: {
        client: 'better-sqlite3',
        connection: ':memory:',
      },
    },
  });
  const database = manager.forPlugin('time-saver');
  class PersistingTaskRunner implements TaskRunner {
    private tasks: TaskInvocationDefinition[] = [];

    getTasks() {
      return this.tasks;
    }

    run(task: TaskInvocationDefinition): Promise<void> {
      this.tasks.push(task);
      return Promise.resolve(undefined);
    }
  }

  const taskRunner = new PersistingTaskRunner();
  const scheduler = {
    createScheduledTaskRunner: (_: unknown) => taskRunner,
  } as unknown as PluginTaskScheduler;
  //  TODO : validate createScheduledTaskRunner parameters types.

  beforeAll(async () => {
    const discovery = HostDiscovery.fromConfig(config);
    const router = await createRouter({
      database: database,
      logger: getVoidLogger(),
      discovery: discovery,
      config: config,
      scheduler: scheduler,
    });
    app = express().use(router);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
});
