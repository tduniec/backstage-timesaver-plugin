import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import Router from 'express-promise-router';
import express from 'express';
import { TsDatabase } from '../database/tsDatabase';
import { ScaffolderDb } from '../database/scaffolderDb';
import { TimeSaverHandler } from '../timeSaver/handler';
import { TsApi } from '../api/apiService';
import { TsScheduler } from '../timeSaver/scheduler';
import { error } from 'winston';
import { loggerToWinstonLogger } from '@backstage/backend-common';

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

export const timeSaverPlugin = createBackendPlugin({
  pluginId: 'time-saver',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        scheduler: coreServices.scheduler,
        database: coreServices.database,
        // The http router service is used to register the router created by the KubernetesBuilder.
        http: coreServices.httpRouter,
      },
      async init({ config, logger, scheduler, database, http }) {
       const  winstonLogger = loggerToWinstonLogger(logger)

        const router = Router();
        router.use(express.json());

        const tsDatabaseInstance = TsDatabase.create(database);
        const scaffolderDbKx = new ScaffolderDb(config).scaffolderKnex();
        const kx = await tsDatabaseInstance.get();
        await TsDatabase.runMigrations(kx);

        if (!scaffolderDbKx) {
          logger.error('Could not get scaffolder database info');
          throw error('Could not get scaffolder database info');
        }

        const tsHandler = new TimeSaverHandler(winstonLogger, config, kx);
        const apiHandler = new TsApi(winstonLogger, config, kx, scaffolderDbKx);
        const tsScheduler = new TsScheduler(winstonLogger, config, kx);

        const taskRunner = scheduler.createScheduledTaskRunner(
          TS_PLUGIN_DEFAULT_SCHEDULE,
        );
        tsScheduler.schedule(taskRunner);


        router.get('/health', (_, response) => {
          logger.info('PONG!');
          response.json({ status: 'ok' });
        });

        router.get('/generateSavings', async (_, response) => {
          const status = await tsHandler.fetchTemplates();
          response.json({ status: status });
        });

        router.get('/getStats/', async (request, response) => {
          const templateId = request.query.templateTaskId;
          const team = request.query.team;
          const templateName = request.query.templateName;
          let result;
          if (templateId) {
            result = await apiHandler.getStatsByTemplateTaskId(String(templateId));
          } else if (team) {
            result = await apiHandler.getStatsByTeam(String(team));
          } else if (templateName) {
            result = await apiHandler.getStatsByTemplate(String(templateName));
          } else {
            result = await apiHandler.getAllStats();
          }
          response.json(result);
        });

        router.get('/getStats/group', async (_request, response) => {
          const result = await apiHandler.getGroupDivisionStats();
          response.json(result);
        });

        router.get('/getDailyTimeSummary/team', async (_request, response) => {
          const result = await apiHandler.getDailyTimeSummariesTeamWise();
          response.json(result);
        });

        router.get('/getDailyTimeSummary/template', async (_request, response) => {
          const result = await apiHandler.getDailyTimeSummariesTemplateWise();
          response.json(result);
        });

        router.get('/getTimeSummary/team', async (_request, response) => {
          const result = await apiHandler.getTimeSummarySavedTeamWise();
          response.json(result);
        });

        router.get('/getTimeSummary/template', async (_request, response) => {
          const result = await apiHandler.getTimeSummarySavedTemplateWise();
          response.json(result);
        });

        router.get('/migrate', async (_request, response) => {
          const result = await apiHandler.updateTemplatesWithSubstituteData();
          response.json(result);
        });

        router.get('/groups', async (_request, response) => {
          const result = await apiHandler.getAllGroups();
          response.json(result);
        });

        router.get('/templates', async (_request, response) => {
          const result = await apiHandler.getAllTemplateNames();
          response.json(result);
        });

        router.get('/templateTasks', async (_request, response) => {
          const result = await apiHandler.getAllTemplateTasks();
          response.json(result);
        });

        router.get('/getTemplateCount', async (_request, response) => {
          const result = await apiHandler.getTemplateCount();
          response.json(result);
        });

        router.get('/getTimeSavedSum', async (request, response) => {
          const divider: number = Number(request.query.divider);
          if (divider !== undefined && divider <= 0) {
            response
              .status(400)
              .json({ error: 'Divider should be a positive number' });
            return;
          }
          const result = divider
            ? await apiHandler.getTimeSavedSum(divider)
            : await apiHandler.getTimeSavedSum();
          response.json(result);
        });

        // We register the router with the http service.
        http.use(router);
      },
    });
  },
});