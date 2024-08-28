import { TimeSaverApi } from './timeSaverApi';
import { DEFAULT_SAMPLE_TEMPLATES_TASKS } from './defaultValues';
import {
  LoggerService,
  RootConfigService,
  AuthService,
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import { ScaffolderStore } from '../database/ScaffolderDatabase';
import { TimeSaverStore } from '../database/TimeSaverDatabase';

describe('TimeSaverApi', () => {
  let auth: AuthService;
  let logger: LoggerService;
  let config: RootConfigService;
  let discovery: DiscoveryService;
  let timeSaverDb: TimeSaverStore;
  let scaffolderDb: ScaffolderStore;
  let tsApi: TimeSaverApi;

  beforeEach(() => {
    logger = {
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
    } as unknown as LoggerService;
    config = { getOptionalString: jest.fn() } as unknown as RootConfigService;
    auth = {} as AuthService;
    discovery = {} as DiscoveryService;
    timeSaverDb = {
      getTemplateNameByTsId: jest.fn(),
      getStatsByTemplateTaskId: jest.fn(),
      getStatsByTeam: jest.fn(),
      getStatsByTemplate: jest.fn(),
      getAllStats: jest.fn(),
      getGroupSavingsDivision: jest.fn(),
      getDailyTimeSummariesTeamWise: jest.fn(),
      getDailyTimeSummariesTemplateWise: jest.fn(),
      getTimeSummarySavedTeamWise: jest.fn(),
      getTimeSummarySavedTemplateWise: jest.fn(),
      getDistinctColumn: jest.fn(),
      getTemplateCount: jest.fn(),
      getTimeSavedSum: jest.fn(),
    } as unknown as TimeSaverStore;
    scaffolderDb = {
      updateTemplateTaskById: jest.fn(),
    } as unknown as ScaffolderStore;
    tsApi = new TimeSaverApi(
      auth,
      logger,
      config,
      discovery,
      timeSaverDb,
      scaffolderDb,
    );
  });

  describe('getTemplateNameByTsId', () => {
    it('should get stats by template task id', async () => {
      // Arrange
      const templateTaskId = 'task1';
      const templateName = 'template1';
      const stats = { count: 10 };
      timeSaverDb.getTemplateNameByTsId = jest
        .fn()
        .mockResolvedValue(templateName);
      timeSaverDb.getStatsByTemplateTaskId = jest.fn().mockResolvedValue(stats);

      // Act
      const result = await tsApi.getStatsByTemplateTaskId(templateTaskId);

      // Assert
      expect(result).toEqual({ templateTaskId, templateName, stats });
      expect(logger.debug).toHaveBeenCalledWith(JSON.stringify(result));
    });
  });
  describe('getStatsByTeam', () => {
    it('should get stats by team', async () => {
      // Arrange
      const team = 'team1';
      const stats = { count: 5 };
      timeSaverDb.getStatsByTeam = jest.fn().mockResolvedValue(stats);

      // Act
      const result = await tsApi.getStatsByTeam(team);

      // Assert
      expect(result).toEqual({ team, stats });
      expect(logger.debug).toHaveBeenCalledWith(JSON.stringify(result));
    });
  });
  describe('getStatsByTemplate', () => {
    it('should get stats by template', async () => {
      // Arrange
      const template = 'template1';
      const stats = { count: 7 };
      timeSaverDb.getStatsByTemplate = jest.fn().mockResolvedValue(stats);

      // Act
      const result = await tsApi.getStatsByTemplate(template);

      // Assert
      expect(result).toEqual({ template_name: template, stats });
      expect(logger.debug).toHaveBeenCalledWith(JSON.stringify(result));
    });
  });
  describe('getAllStats', () => {
    it('should get all stats', async () => {
      // Arrange
      const stats = [{ count: 10 }];
      timeSaverDb.getAllStats = jest.fn().mockResolvedValue(stats);

      // Act
      const result = await tsApi.getAllStats();

      // Assert
      expect(result).toEqual({ stats });
      expect(logger.debug).toHaveBeenCalledWith(JSON.stringify(result));
    });
  });
  describe('getGroupDivisionStats', () => {
    it('should get group division stats', async () => {
      // Arrange
      const stats = [{ group: 'group1', count: 3 }];
      timeSaverDb.getGroupSavingsDivision = jest.fn().mockResolvedValue(stats);

      // Act
      const result = await tsApi.getGroupDivisionStats();

      // Assert
      expect(result).toEqual({ stats });
      expect(logger.debug).toHaveBeenCalledWith(JSON.stringify(result));
    });
  });
  describe('getDailyTimeSummariesTemplateWise', () => {
    it('should get daily time summaries template wise', async () => {
      // Arrange
      const stats = [{ template: 'template1', time: 150 }];
      timeSaverDb.getDailyTimeSummariesTemplateWise = jest
        .fn()
        .mockResolvedValue(stats);

      // Act
      const result = await tsApi.getDailyTimeSummariesTemplateWise();

      // Assert
      expect(result).toEqual({ stats });
      expect(logger.debug).toHaveBeenCalledWith(JSON.stringify(result));
    });
  });
  describe('getTimeSummarySavedTeamWise', () => {
    it('should get time summary saved team wise', async () => {
      // Arrange
      const stats = [{ team: 'team1', timeSaved: 200 }];
      timeSaverDb.getTimeSummarySavedTeamWise = jest
        .fn()
        .mockResolvedValue(stats);

      // Act
      const result = await tsApi.getTimeSummarySavedTeamWise();

      // Assert
      expect(result).toEqual({ stats });
      expect(logger.debug).toHaveBeenCalledWith(JSON.stringify(result));
    });
  });
  describe('getTimeSummarySavedTemplateWise', () => {
    it('should get time summary saved template wise', async () => {
      // Arrange
      const stats = [{ template: 'template1', timeSaved: 250 }];
      timeSaverDb.getTimeSummarySavedTemplateWise = jest
        .fn()
        .mockResolvedValue(stats);

      // Act
      const result = await tsApi.getTimeSummarySavedTemplateWise();

      // Assert
      expect(result).toEqual({ stats });
      expect(logger.debug).toHaveBeenCalledWith(JSON.stringify(result));
    });
  });
  describe('getSampleMigrationClassificationConfig', () => {
    it('should get sample migration classification config with default values', async () => {
      // Arrange
      const options = { useScaffolderTasksEntries: false };

      // Act
      const result = await tsApi.getSampleMigrationClassificationConfig(
        undefined,
        options,
      );

      // Assert
      expect(result.status).toBe('OK');
      expect(result.data).toHaveLength(DEFAULT_SAMPLE_TEMPLATES_TASKS.length);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(
          'user-defined templates tasks list and default classification',
        ),
      );
    });

    it('should get sample migration classification config with custom values', async () => {
      // Arrange
      const customClassificationRequest = { engineering: { devops: 10 } };
      const options = { useScaffolderTasksEntries: false };

      // Act
      const result = await tsApi.getSampleMigrationClassificationConfig(
        customClassificationRequest,
        options,
      );

      // Assert
      expect(result.status).toBe('OK');
      expect(result.data).toHaveLength(DEFAULT_SAMPLE_TEMPLATES_TASKS.length);
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining(
          'user-defined templates tasks list and user-defined classification',
        ),
      );
    });

    it('should fail to get sample migration classification config with empty custom request', async () => {
      // Arrange
      const customClassificationRequest = {};

      // Act
      const result = await tsApi.getSampleMigrationClassificationConfig(
        customClassificationRequest,
      );

      // Assert
      expect(result.status).toBe('FAIL');
      expect(result.errorMessage).toBe(
        'getSampleMigrationClassificationConfig : customClassificationRequest cannot be an empty object',
      );
      expect(logger.error).toHaveBeenCalledWith(
        'getSampleMigrationClassificationConfig : customClassificationRequest cannot be an empty object',
      );
    });
  });
  describe('getAllGroups', () => {
    it('should get all groups', async () => {
      // Arrange
      const groups = { team: ['team1'] };
      timeSaverDb.getDistinctColumn = jest.fn().mockResolvedValue(groups);

      // Act
      const result = await tsApi.getAllGroups();

      // Assert
      expect(result.groups).toEqual(['team1']);
      expect(logger.debug).toHaveBeenCalledWith(JSON.stringify(result));
    });

    it('should handle no groups found', async () => {
      // Arrange
      timeSaverDb.getDistinctColumn = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getAllGroups();

      // Assert
      expect(result.groups).toEqual([]);
      expect(result.errorMessage).toBe('getAllGroups - DB returned 0 rows');
      expect(logger.warn).toHaveBeenCalledWith(
        'getAllGroups - DB returned 0 rows',
      );
    });
  });
  describe('getAllTemplateNames', () => {
    it('should get all template names', async () => {
      // Arrange
      const templates = { template_name: ['template1'] };
      timeSaverDb.getDistinctColumn = jest.fn().mockResolvedValue(templates);

      // Act
      const result = await tsApi.getAllTemplateNames();

      // Assert
      expect(result.templates).toEqual(['template1']);
      expect(logger.debug).toHaveBeenCalledWith(JSON.stringify(result));
    });

    it('should handle no template names found', async () => {
      // Arrange
      timeSaverDb.getDistinctColumn = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getAllTemplateNames();

      // Assert
      expect(result.templates).toEqual([]);
      expect(result.errorMessage).toBe('getAllGroups - DB returned 0 rows');
      expect(logger.warn).toHaveBeenCalledWith(
        'getAllGroups - DB returned 0 rows',
      );
    });
  });

  describe('getAllTemplateTasks', () => {
    it('should get all template tasks', async () => {
      // Arrange
      const templateTasks = { template_task_id: ['task1'] };
      timeSaverDb.getDistinctColumn = jest
        .fn()
        .mockResolvedValue(templateTasks);

      // Act
      const result = await tsApi.getAllTemplateTasks();

      // Assert
      expect(result.templateTasks).toEqual(['task1']);
      expect(logger.debug).toHaveBeenCalledWith(JSON.stringify(result));
    });

    it('should handle no template tasks found', async () => {
      // Arrange
      timeSaverDb.getDistinctColumn = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getAllTemplateTasks();

      // Assert
      expect(result.templateTasks).toEqual([]);
      expect(result.errorMessage).toBe('getAllGroups - DB returned 0 rows');
      expect(logger.warn).toHaveBeenCalledWith(
        'getAllGroups - DB returned 0 rows',
      );
    });
  });

  describe('getTemplateCount', () => {
    it('should get template count', async () => {
      // Arrange
      const templateCount = 5;
      timeSaverDb.getTemplateCount = jest.fn().mockResolvedValue(templateCount);

      // Act
      const result = await tsApi.getTemplateCount();

      // Assert
      expect(result.templateCount).toBe(5);
      expect(logger.debug).toHaveBeenCalledWith(
        'getTemplateCount: {"templateCount":5}',
      );
    });

    it('should handle no template count found', async () => {
      // Arrange
      timeSaverDb.getTemplateCount = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getTemplateCount();

      // Assert
      expect(result.templateCount).toBe(0);
      expect(result.errorMessage).toBe(
        'getTemplateCount did not return any results',
      );
      expect(logger.warn).toHaveBeenCalledWith(
        'getTemplateCount did not return any results',
      );
    });
  });

  describe('getTimeSavedSum', () => {
    it('should get time saved sum', async () => {
      // Arrange
      const sum = 1000;
      timeSaverDb.getTimeSavedSum = jest.fn().mockResolvedValue(sum);

      // Act
      const result = await tsApi.getTimeSavedSum(2);

      // Assert
      expect(result.timeSaved).toBe(500);
      expect(logger.debug).toHaveBeenCalledWith(JSON.stringify(result));
    });

    it('should handle no time saved sum found', async () => {
      // Arrange
      timeSaverDb.getTimeSavedSum = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await tsApi.getTimeSavedSum();

      // Assert
      expect(result.timeSaved).toBe(0);
      expect(result.errorMessage).toBe('getTimeSavedSum - DB returned 0 rows');
      expect(logger.warn).toHaveBeenCalledWith(
        'getTimeSavedSum - DB returned 0 rows',
      );
    });
  });
});
