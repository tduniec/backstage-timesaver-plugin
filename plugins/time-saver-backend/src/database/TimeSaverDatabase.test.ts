import { DatabaseManager } from '@backstage/backend-defaults/database';
import { mockServices } from '@backstage/backend-test-utils';
import { ConfigReader } from '@backstage/config';
import { Knex as KnexType } from 'knex';
import { TimeSaverDatabase, TimeSaverStore } from './TimeSaverDatabase';
import { TemplateTimeSavings } from './types';
import { DateTime } from 'luxon';

const templateTimeSavings: TemplateTimeSavings[] = [
  {
    team: 'engineering',
    role: 'developer',
    createdAt: DateTime.fromISO('2024-07-17T18:32:48'),
    createdBy: 'test',
    timeSaved: 10,
    templateName: 'template:default/create-perfect-world',
    templateTaskId: '1f8ab1bc-f4b2-4bf1-ae38-ad4b2478a29c',
    templateTaskStatus: 'Completed',
  } as TemplateTimeSavings,
  {
    team: 'engineering',
    role: 'developer',
    createdAt: DateTime.fromISO('2024-07-17T20:00:00'),
    createdBy: 'test',
    timeSaved: 10,
    templateName: 'template:default/create-perfect-world',
    templateTaskId: '1f8ab1bc-f4b2-4bf1-ae38-ad4b2478a29b',
    templateTaskStatus: 'Completed',
  } as TemplateTimeSavings,
  {
    team: 'engineering',
    role: 'devsecops',
    createdAt: DateTime.fromISO('2024-07-17T18:32:48'),
    createdBy: 'test',
    timeSaved: 10,
    templateName: 'template:default/create-normal-world',
    templateTaskId: 'b52f9afc-136a-4ef5-8e16-e1fba1e67a2c',
    templateTaskStatus: 'Completed',
  } as TemplateTimeSavings,
  {
    team: 'engineering',
    role: 'developer',
    createdAt: DateTime.fromISO('2024-07-18T18:32:48'),
    createdBy: 'test',
    timeSaved: 10,
    templateName: 'template:default/create-perfect-world',
    templateTaskId: '1d8acff6-0e8c-47e3-a1be-07a312f69f7b',
    templateTaskStatus: 'Completed',
  } as TemplateTimeSavings,
  {
    team: 'architecture',
    role: 'developer',
    createdAt: DateTime.fromISO('2024-07-19T18:32:48'),
    createdBy: 'test',
    timeSaved: 10,
    templateName: 'template:default/create-normal-world',
    templateTaskId: '93009622-8fb9-4afd-9fc5-cf1c4949613f',
    templateTaskStatus: 'Completed',
  } as TemplateTimeSavings,
];

const db = DatabaseManager.fromConfig(
  new ConfigReader({
    backend: {
      database: {
        client: 'better-sqlite3',
        connection: ':memory:',
      },
    },
  }),
).forPlugin('timesaver');

const createDatabaseManager = (
  client: KnexType,
  skipMigrations: boolean = false,
) => ({
  getClient: async () => client,
  migrations: {
    skip: skipMigrations,
  },
});

const createLoggerManager = () => ({
  getLogger: () => mockServices.rootLogger.mock(),
});

let database: TimeSaverStore;
describe('TimeSaverDatabase', () => {
  beforeAll(async () => {
    const client = await db.getClient();
    const databaseManager = createDatabaseManager(client);
    const loggerManager = createLoggerManager();
    const logger = loggerManager.getLogger();
    database = await TimeSaverDatabase.create(databaseManager, logger);
  });

  describe('insert', () => {
    it('inserts template time savings record', async () => {
      const result = await database.insert(templateTimeSavings[0]);
      expect(result).toBeTruthy();
      expect(typeof result?.id).not.toBe(undefined);
    });
  });

  describe('update', () => {
    it('updates template time savings record', async () => {
      await database.insert(templateTimeSavings[1]);
      const result = await database.update(
        {
          ...templateTimeSavings[1],
          templateName: 'template:default/create-bizarre-world',
        },
        {
          template_task_id: templateTimeSavings[1].templateTaskId,
        },
      );
      if (result) {
        delete result.id;
      }
      expect(result).toBeTruthy();
      expect(result).toStrictEqual({
        ...templateTimeSavings[1],
        templateName: 'template:default/create-bizarre-world',
      });
    });
  });

  describe('delete', () => {
    it('deletes template time savings record', async () => {
      const result = await database.delete({
        template_task_id: templateTimeSavings[0].templateTaskId,
      });
      if (result) {
        result.map(e => delete e.id);
      }
      expect(result).toBeTruthy();
      expect(result).toStrictEqual([templateTimeSavings[0]]);
    });
  });

  describe('truncate', () => {
    it('clears out table', async () => {
      const result = await database.truncate();
      expect(result).toBe(true);
    });
  });

  describe('getTemplateNameByTsId', () => {
    beforeAll(async () => {
      templateTimeSavings.forEach(async e => await database.insert(e));
    });

    afterAll(async () => {
      await database.truncate();
    });

    it('returns template name string from row matching TemplateTaskId', async () => {
      const result = await database.getTemplateNameByTsId(
        templateTimeSavings[0].templateTaskId,
      );
      expect(result).toEqual(templateTimeSavings[0].templateName);
    });

    it('returns undefined when no matching TemplateTaskId is found', async () => {
      const result = await database.getTemplateNameByTsId(
        'template:default/this-does-not-exists',
      );
      expect(result).toEqual(undefined);
    });

    it('returns undefined when database is empty', async () => {
      await database.truncate();
      const result = await database.getTemplateNameByTsId(
        'template:default/this-does-not-exists',
      );
      expect(result).toEqual(undefined);
    });
  });

  describe('getStatsByTemplateTaskId', () => {
    beforeAll(async () => {
      templateTimeSavings.forEach(async e => await database.insert(e));
    });

    afterAll(async () => {
      await database.truncate();
    });

    it('returns statistics from row matching TemplateTaskId', async () => {
      const result = await database.getStatsByTemplateTaskId(
        templateTimeSavings[0].templateTaskId,
      );
      expect(result).toStrictEqual([
        {
          team: 'engineering',
          timeSaved: 10,
          templateName: undefined,
        },
      ]);
    });

    it('returns undefined when no matching template task id is found', async () => {
      const result = await database.getStatsByTemplateTaskId(
        '41d99439-c377-4aa5-87aa-7e350004d950',
      );
      expect(result).toEqual(undefined);
    });

    it('returns undefined when database is empty', async () => {
      await database.truncate();
      const result = await database.getStatsByTemplateTaskId(
        '41d99439-c377-4aa5-87aa-7e350004d950',
      );
      expect(result).toEqual(undefined);
    });
  });

  describe('getStatsByTeam', () => {
    beforeAll(async () => {
      templateTimeSavings.forEach(async e => await database.insert(e));
    });

    afterAll(async () => {
      await database.truncate();
    });

    it('returns statistics from row matching team', async () => {
      const result = await database.getStatsByTeam(templateTimeSavings[0].team);
      expect(result).toStrictEqual([
        {
          timeSaved: 10,
          team: 'engineering',
          templateName: 'template:default/create-normal-world',
        },
        {
          timeSaved: 30,
          team: 'engineering',
          templateName: 'template:default/create-perfect-world',
        },
      ]);
    });

    it('returns undefined when no matching team is found', async () => {
      const result = await database.getStatsByTeam('business');
      expect(result).toEqual(undefined);
    });

    it('returns undefined when database is empty', async () => {
      await database.truncate();
      const result = await database.getStatsByTeam('business');
      expect(result).toEqual(undefined);
    });
  });

  describe('getStatsByTemplate', () => {
    beforeAll(async () => {
      templateTimeSavings.forEach(async e => await database.insert(e));
    });

    afterAll(async () => {
      await database.truncate();
    });

    it('returns statistics from row matching template name', async () => {
      const result = await database.getStatsByTemplate(
        templateTimeSavings[0].templateName,
      );
      expect(result).toStrictEqual([
        {
          timeSaved: 30,
          team: 'engineering',
          templateName: undefined,
        },
      ]);
    });

    it('returns undefined when no matching template name is found', async () => {
      const result = await database.getStatsByTemplate(
        'template:default/this-does-not-exists',
      );
      expect(result).toEqual(undefined);
    });

    it('returns undefined when database is empty', async () => {
      await database.truncate();
      const result = await database.getStatsByTemplate(
        'template:default/this-does-not-exists',
      );
      expect(result).toEqual(undefined);
    });
  });

  describe('getAllStats', () => {
    beforeAll(async () => {
      templateTimeSavings.forEach(async e => await database.insert(e));
    });

    afterAll(async () => {
      await database.truncate();
    });

    it('returns statistics from row matching template name', async () => {
      const result = await database.getAllStats();
      expect(result).toStrictEqual([
        {
          timeSaved: 10,
          team: 'architecture',
          templateName: 'template:default/create-normal-world',
        },
        {
          timeSaved: 10,
          team: 'engineering',
          templateName: 'template:default/create-normal-world',
        },
        {
          timeSaved: 30,
          team: 'engineering',
          templateName: 'template:default/create-perfect-world',
        },
      ]);
    });

    it('returns undefined when database is empty', async () => {
      await database.truncate();
      const result = await database.getAllStats();
      expect(result).toEqual(undefined);
    });
  });

  describe('getGroupSavingsDivision', () => {
    beforeAll(async () => {
      templateTimeSavings.forEach(async e => await database.insert(e));
    });

    afterAll(async () => {
      await database.truncate();
    });

    it('returns statistics from row matching template name', async () => {
      const result = await database.getGroupSavingsDivision();
      expect(result).toStrictEqual([
        {
          team: 'architecture',
          percentage: 100,
        },
        {
          team: 'engineering',
          percentage: 100,
        },
      ]);
    });

    it('returns undefined when no matching template name is found', async () => {
      const result = await database.getStatsByTemplate(
        'template:default/this-does-not-exists',
      );
      expect(result).toEqual(undefined);
    });

    it('returns undefined when database is empty', async () => {
      await database.truncate();
      const result = await database.getGroupSavingsDivision();
      expect(result).toEqual(undefined);
    });
  });

  describe('getDailyTimeSummariesTeamWise', () => {
    beforeAll(async () => {
      templateTimeSavings.forEach(async e => await database.insert(e));
    });

    afterAll(async () => {
      await database.truncate();
    });

    it('returns total time saved by each team each year, in date ascending order', async () => {
      const result = await database.getDailyTimeSummariesTeamWise();
      // Only take the year into account to re-create date values
      expect(result).toStrictEqual([
        {
          team: 'engineering',
          date: DateTime.fromISO('2024-07-17T00:00:00'),
          templateName: undefined,
          totalTimeSaved: 30,
        },
        {
          team: 'engineering',
          date: DateTime.fromISO('2024-07-18T00:00:00'),
          templateName: undefined,
          totalTimeSaved: 10,
        },
        {
          team: 'architecture',
          date: DateTime.fromISO('2024-07-19T00:00:00'),
          templateName: undefined,
          totalTimeSaved: 10,
        },
      ]);
    });

    it('returns undefined when database is empty', async () => {
      await database.truncate();
      const result = await database.getDailyTimeSummariesTeamWise();
      expect(result).toEqual(undefined);
    });
  });

  describe('getDailyTimeSummariesTemplateWise', () => {
    beforeAll(async () => {
      templateTimeSavings.forEach(async e => await database.insert(e));
    });

    afterAll(async () => {
      await database.truncate();
    });

    it('returns total time saved by each template each year, in date ascending order', async () => {
      const result = await database.getDailyTimeSummariesTemplateWise();
      // Only take the year into account to re-create date values
      expect(result).toStrictEqual([
        {
          date: DateTime.fromISO('2024-07-17T00:00:00'),
          team: undefined,
          templateName: 'template:default/create-normal-world',
          totalTimeSaved: 10,
        },
        {
          date: DateTime.fromISO('2024-07-17T00:00:00'),
          team: undefined,
          templateName: 'template:default/create-perfect-world',
          totalTimeSaved: 20,
        },
        {
          date: DateTime.fromISO('2024-07-18T00:00:00'),
          team: undefined,
          templateName: 'template:default/create-perfect-world',
          totalTimeSaved: 10,
        },
        {
          date: DateTime.fromISO('2024-07-19T00:00:00'),
          team: undefined,
          templateName: 'template:default/create-normal-world',
          totalTimeSaved: 10,
        },
      ]);
    });

    it('returns undefined when database is empty', async () => {
      await database.truncate();
      const result = await database.getDailyTimeSummariesTemplateWise();
      expect(result).toEqual(undefined);
    });
  });

  describe('getTimeSummarySavedTeamWise', () => {
    beforeAll(async () => {
      templateTimeSavings.forEach(async e => await database.insert(e));
    });

    afterAll(async () => {
      await database.truncate();
    });

    it('returns the total time saved per team per date', async () => {
      const result = await database.getTimeSummarySavedTeamWise();
      // Only take the year into account to re-create date values
      expect(result).toStrictEqual([
        {
          date: DateTime.fromISO('2024-07-17T00:00:00'),
          team: 'engineering',
          templateName: undefined,
          totalTimeSaved: 30,
        },
        {
          date: DateTime.fromISO('2024-07-18T00:00:00'),
          team: 'engineering',
          templateName: undefined,
          totalTimeSaved: 10,
        },
        {
          date: DateTime.fromISO('2024-07-19T00:00:00'),
          team: 'architecture',
          templateName: undefined,
          totalTimeSaved: 10,
        },
      ]);
    });

    it('returns undefined when database is empty', async () => {
      await database.truncate();
      const result = await database.getTimeSummarySavedTeamWise();
      expect(result).toEqual(undefined);
    });
  });

  describe('getTimeSummarySavedTemplateWise', () => {
    beforeAll(async () => {
      templateTimeSavings.forEach(async e => await database.insert(e));
    });

    afterAll(async () => {
      await database.truncate();
    });

    it('...', async () => {
      const result = await database.getTimeSummarySavedTemplateWise();
      // Only take the year into account to re-create date values
      expect(result).toStrictEqual([
        {
          date: DateTime.fromISO('2024-07-17T00:00:00'),
          team: undefined,
          templateName: 'template:default/create-normal-world',
          totalTimeSaved: 10,
        },
        {
          date: DateTime.fromISO('2024-07-17T00:00:00'),
          team: undefined,
          templateName: 'template:default/create-perfect-world',
          totalTimeSaved: 20,
        },
        {
          date: DateTime.fromISO('2024-07-18T00:00:00'),
          team: undefined,
          templateName: 'template:default/create-perfect-world',
          totalTimeSaved: 10,
        },
        {
          date: DateTime.fromISO('2024-07-19T00:00:00'),
          team: undefined,
          templateName: 'template:default/create-normal-world',
          totalTimeSaved: 10,
        },
      ]);
    });

    it('returns undefined when database is empty', async () => {
      await database.truncate();
      const result = await database.getTimeSummarySavedTemplateWise();
      expect(result).toEqual(undefined);
    });
  });

  describe('getDistinctColumn', () => {
    beforeAll(async () => {
      templateTimeSavings.forEach(async e => await database.insert(e));
    });

    afterAll(async () => {
      await database.truncate();
    });

    it('returns distinct teams', async () => {
      const result = await database.getDistinctColumn('team');

      expect(result).toStrictEqual({
        team: ['engineering', 'architecture'],
      });
    });

    it('returns undefined when database is empty', async () => {
      await database.truncate();
      const result = await database.getDistinctColumn('team');
      expect(result).toEqual(undefined);
    });
  });

  describe('getTemplateCount', () => {
    beforeAll(async () => {
      templateTimeSavings.forEach(async e => await database.insert(e));
    });

    afterAll(async () => {
      await database.truncate();
    });

    it('returns number of templates', async () => {
      const result = await database.getTemplateCount();

      expect(result).toBe(5);
    });
  });

  describe('getTimeSavedSum', () => {
    beforeAll(async () => {
      templateTimeSavings.forEach(async e => await database.insert(e));
    });

    afterAll(async () => {
      await database.truncate();
    });

    it('returns total time saved', async () => {
      const result = await database.getTimeSavedSum();

      expect(result).toBe(50);
    });
  });
});
