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
import express from 'express';
import { LoggerService } from '@backstage/backend-plugin-api';
import { TimeSaverHandler } from '../timeSaver/handler';
import { TimeSaverApi } from '../api/timeSaverApi';
import { IQuery } from '../database/types';

export function setupCommonRoutes(
  router: express.Router,
  logger: LoggerService,
  tsHandler: TimeSaverHandler,
  apiHandler: TimeSaverApi,
) {
  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  router.get('/generateSavings', async (_, response) => {
    const status = await tsHandler.fetchTemplates();
    response.json({ status: status });
  });

  router.get('/getStats/', async (request, response) => {
    const { templateId, team, templateName } = request.query;

    let result;
    if (templateId) {
      result = await apiHandler.getStatsByTemplateTaskId(
        String(templateId),
        request.query,
      );
    } else if (team) {
      result = await apiHandler.getStatsByTeam(String(team), request.query);
    } else if (templateName) {
      result = await apiHandler.getStatsByTemplate(
        String(templateName),
        request.query,
      );
    } else {
      result = await apiHandler.getAllStats(request.query);
    }
    response.json(result);
  });

  router.get('/getStats/group', async (request, response) => {
    const { query } = request;
    const result = await apiHandler.getGroupDivisionStats(query as IQuery);
    response.json(result);
  });

  router.get('/getDailyTimeSummary/team', async (request, response) => {
    const { query } = request;
    const result = await apiHandler.getDailyTimeSummariesTeamWise(
      query as IQuery,
    );
    response.json(result);
  });

  router.get('/getDailyTimeSummary/template', async (request, response) => {
    const { query } = request;
    const result = await apiHandler.getDailyTimeSummariesTemplateWise(
      query as IQuery,
    );
    response.json(result);
  });

  router.get('/getTimeSummary/team', async (request, response) => {
    const { query } = request;

    const result = await apiHandler.getTimeSummarySavedTeamWise(
      query as IQuery,
    );
    response.json(result);
  });

  router.get('/getTimeSummary/template', async (request, response) => {
    const { query } = request;

    const result = await apiHandler.getTimeSummarySavedTemplateWise(
      query as IQuery,
    );
    response.json(result);
  });

  router.get('/migrate', async (_request, response) => {
    const result = await apiHandler.updateTemplatesWithSubstituteData();
    response.json(result);
  });

  router.post('/migrate', async (_request, response) => {
    const template_classification = _request.body;
    const result = await apiHandler.updateTemplatesWithSubstituteData(
      template_classification,
    );
    response.json(result);
  });

  router.get('/generate-sample-classification', async (_request, response) => {
    const { useScaffolderTasksEntries } = _request.query;
    response.json(
      await apiHandler.getSampleMigrationClassificationConfig(undefined, {
        useScaffolderTasksEntries: !!(useScaffolderTasksEntries === 'true'),
      }),
    );
  });

  router.post('/generate-sample-classification', async (_request, response) => {
    const { customClassificationRequest, options } = _request.body;
    response.json(
      await apiHandler.getSampleMigrationClassificationConfig(
        customClassificationRequest,
        options,
      ),
    );
  });

  router.get('/groups', async (request, response) => {
    const { query } = request;
    const result = await apiHandler.getAllGroups(query as IQuery);
    response.json(result);
  });

  router.get('/templates', async (request, response) => {
    const { query } = request;
    const result = await apiHandler.getAllTemplateNames(query as IQuery);
    response.json(result);
  });

  router.get('/templateTasks', async (_request, response) => {
    const result = await apiHandler.getAllTemplateTasks();
    response.json(result);
  });

  router.get('/getTemplateCount', async (request, response) => {
    const { query } = request;
    const result = await apiHandler.getTemplateCount(query as IQuery);
    response.json(result);
  });

  router.get('/getTimeSavedSum', async (request, response) => {
    const { query } = request;

    const divider =
      typeof query.divider !== 'undefined' ? Number(query.divider) : undefined;
    if (divider !== undefined && divider <= 0) {
      response
        .status(400)
        .json({ error: 'Divider should be a positive number' });
      return;
    }

    const result = await apiHandler.getTimeSavedSum(divider, query);
    response.json(result);
  });

  return router;
}
