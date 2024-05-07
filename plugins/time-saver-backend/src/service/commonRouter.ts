import express from 'express';
import { Logger } from 'winston';
import { TimeSaverHandler } from '../timeSaver/handler';
import { TsApi } from '../api/apiService';

export function setupCommonRoutes(
  router: express.Router,
  logger: Logger,
  tsHandler: TimeSaverHandler,
  apiHandler: TsApi
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

      return router
}