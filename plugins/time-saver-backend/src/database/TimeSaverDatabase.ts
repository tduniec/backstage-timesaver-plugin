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

/**
 * Defines a TimeSaverStore interface and a TimeSaverDatabase class for managing time-saving data in a database.
 *
 * This TypeScript code includes interfaces and classes for interacting with a database to insert, update, delete, and retrieve time-saving statistics and summaries.
 *
 * @packageDocumentation
 */

import {
  DatabaseService,
  LoggerService,
  resolvePackagePath,
} from '@backstage/backend-plugin-api';
import { Knex } from 'knex';
import {
  TemplateTimeSavings,
  TemplateTimeSavingsDbRow,
  TimeSavedStatistics,
  TimeSavedStatisticsDbRow,
  GroupSavingsDivision,
  GroupSavingsDivisionDbRow,
  TimeSummary,
  RawDbTimeSummary,
  TemplateTimeSavingsDistinctRbRow,
} from './types';
import {
  TemplateTimeSavingsCollectionMap,
  GroupSavingsDivisionMap,
  TemplateTimeSavingsMap,
  TimeSavedStatisticsMap,
  TimeSummaryMap,
} from './mappers';

const TIME_SAVINGS_TABLE = 'ts_template_time_savings';
const EXCLUDED_TASKS_TABLE = 'ts_excluded_tasks_everywhere';

export interface TimeSaverStore {
  insert(
    templateTimeSavings: NonNullable<TemplateTimeSavings>,
  ): Promise<TemplateTimeSavings | undefined | void>;
  update(
    data: TemplateTimeSavings,
    key: Record<string, string>,
  ): Promise<TemplateTimeSavings | undefined | void>;
  delete(
    key: Record<string, string>,
  ): Promise<TemplateTimeSavings[] | undefined | void>;
  truncate(): Promise<boolean | void>;
  getTemplateNameByTsId(
    templateTaskId: string,
  ): Promise<string | undefined | void>;
  getStatsByTemplateTaskId(
    templateTaskId: string,
  ): Promise<TimeSavedStatistics[] | void>;
  getStatsByTeam(team: string): Promise<TimeSavedStatistics[] | void>;
  getStatsByTemplate(template: string): Promise<TimeSavedStatistics[] | void>;
  getAllStats(): Promise<TimeSavedStatistics[] | void>;
  getGroupSavingsDivision(): Promise<GroupSavingsDivision[] | void>;
  getDailyTimeSummariesTeamWise(): Promise<TimeSummary[] | void>;
  getDailyTimeSummariesTemplateWise(): Promise<TimeSummary[] | void>;
  getTimeSummarySavedTeamWise(): Promise<TimeSummary[] | void>;
  getTimeSummarySavedTemplateWise(): Promise<TimeSummary[] | void>;
  getDistinctColumn(
    column: string,
  ): Promise<{ [x: string]: (string | number)[] } | undefined | void>;
  getTemplateCount(): Promise<number | void>;
  getTimeSavedSum(): Promise<number | void>;
  getTasksToExclude(): Promise<string[] | undefined | void>;
}

const migrationsDir = resolvePackagePath(
  '@tduniec/backstage-plugin-time-saver-backend',
  'migrations',
);

export class TimeSaverDatabase implements TimeSaverStore {
  /**
   * Constructor for initializing a new instance with a Knex database connection and a logger service.
   * @param {Knex} db - The Knex database connection.
   * @param {LoggerService} logger - The logger service for logging.
   */
  constructor(
    private readonly db: Knex,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Creates a new instance of TimeSaverStore by initializing a database connection and running migrations if necessary.
   *
   * This static method creates a new TimeSaverDatabase instance by obtaining a database client, checking for migrations, running the latest migrations, and returning the initialized TimeSaverDatabase.
   *
   * @async
   * @param {DatabaseService} database - The DatabaseService instance for database operations.
   * @param {LoggerService} logger - The LoggerService instance for logging.
   * @returns {Promise<TimeSaverStore>} A promise that resolves to a TimeSaverStore instance.
   */
  static async create(
    database: DatabaseService,
    logger: LoggerService,
  ): Promise<TimeSaverStore> {
    const knex = await database.getClient();

    if (!database.migrations?.skip) {
      await knex.migrate.latest({
        directory: migrationsDir,
      });
    }
    return new TimeSaverDatabase(knex, logger);
  }

  /**
   * Logs a success message and returns the result.
   *
   * This method logs a success message using the provided logger, stringify the result, and returns the result.
   *
   * @template T
   * @param {T | undefined} result - The result to be logged and returned.
   * @param {string} [logMessage='Data selected successfully'] - The message to log along with the result.
   * @returns {T | undefined} The result passed as input.
   */
  ok<T>(
    result: T | undefined,
    logMessage: string = 'Data selected successfully',
  ): T | undefined {
    this.logger.debug(`${logMessage} ${JSON.stringify(result)}`);
    return result;
  }

  /**
   * Logs an error message, throws the error, and does not return a value.
   *
   * This method logs an error message using the provided logger, throws the error passed as input, and does not return a value.
   *
   * @param {Error | unknown} error - The error object to log and throw.
   * @param {string} [errorMessage='Error selecting data:'] - The message to log as an error.
   */
  fail(error: Error | unknown, errorMessage: string = 'Error selecting data:') {
    this.logger.error(errorMessage, error ? (error as Error) : undefined);
    throw error;
  }

  /**
   * Formats a date column based on the database client type.
   *
   * This method formats a date column according to the specific syntax of the database client type (SQLite, MySQL, MSSQL, or PostgreSQL).
   *
   * @param {Knex} knex - The Knex instance for database operations.
   * @param {string} column - The name of the column to format as a date.
   * @param {string} [alias='date'] - The alias to use for the formatted date column.
   * @returns {Knex.Raw} A Knex raw query object representing the formatted date column.
   */
  private formatDate(
    knex: Knex,
    column: string,
    alias: string = 'date',
  ): Knex.Raw {
    const { client } = knex.client.config;
    if (client === 'better-sqlite3') {
      return knex.raw(`strftime('%Y-%m-%d', ${column}) as ${alias}`);
    } else if (client === 'mysql') {
      return knex.raw(`DATE_FORMAT(${column}, '%Y-%m-%d') as ${alias}`);
    } else if (client === 'mssql') {
      return knex.raw(`FORMAT(${column}, 'yyyy-MM-dd') as ${alias}`);
    }
    // PostgreSQL or other databases
    return knex.raw(`TO_CHAR(${column}, 'YYYY-MM-DD') as ${alias}`);
  }

  /**
   * Inserts a TemplateTimeSavings record into the database.
   *
   * This method inserts a TemplateTimeSavings record into the specified table, converts the inserted rows to DTO format, and returns the result.
   *
   * @param {NonNullable<TemplateTimeSavings>} templateTimeSavings - The TemplateTimeSavings object to insert.
   * @returns {Promise<TemplateTimeSavings | undefined | void>} A promise resolving to the inserted TemplateTimeSavings record or undefined.
   */
  async insert(
    templateTimeSavings: NonNullable<TemplateTimeSavings>,
  ): Promise<TemplateTimeSavings | undefined | void> {
    this.logger.debug(
      `templateTimeSavings insert: ${JSON.stringify(templateTimeSavings)}`,
    );
    try {
      const insertedRows = await this.db<TemplateTimeSavingsDbRow>(
        TIME_SAVINGS_TABLE,
      )
        .insert(TemplateTimeSavingsMap.toPersistence(templateTimeSavings))
        .returning('*');
      this.logger.debug(`insertedRows: ${JSON.stringify(insertedRows)}`);

      return this.ok<TemplateTimeSavings | undefined>(
        insertedRows && insertedRows.length
          ? TemplateTimeSavingsMap.toDTO(insertedRows[0])
          : undefined,
        'Data inserted successfully',
      );
    } catch (error) {
      return this.fail(error, 'Error inserting data:');
    }
  }

  /**
   * Updates a TemplateTimeSavings record in the database based on the provided key.
   *
   * This method updates a TemplateTimeSavings record in the specified table using the given key, converts the updated result to DTO format, and returns the updated data.
   *
   * @param {TemplateTimeSavings} data - The TemplateTimeSavings object with updated data.
   * @param {Record<string, string>} key - The key to identify the record to update.
   * @returns {Promise<TemplateTimeSavings | undefined | void>} A promise resolving to the updated TemplateTimeSavings record or undefined.
   */
  async update(
    data: TemplateTimeSavings,
    key: Record<string, string>,
  ): Promise<TemplateTimeSavings | undefined | void> {
    this.logger.debug(`templateTimeSavings update: ${JSON.stringify(data)}`);
    try {
      const result = await this.db<TemplateTimeSavingsDbRow>(TIME_SAVINGS_TABLE)
        .where(key)
        .update(TemplateTimeSavingsMap.toPersistence(data))
        .returning('*');
      this.logger.debug(`updatedRows: ${JSON.stringify(result)}`);

      return this.ok<TemplateTimeSavings | undefined>(
        result.length > 0 ? TemplateTimeSavingsMap.toDTO(result[0]) : undefined,
        'Data updated successfully',
      );
    } catch (error) {
      return this.fail(error, 'Error updating data:');
    }
  }

  /**
   * Deletes a record from the TIME_SAVINGS_TABLE based on the specified key.
   *
   * This asynchronous method attempts to delete a record that matches the provided key from the database.
   * If the database client is 'better-sqlite3', it first retrieves the existing record before performing the deletion.
   * The method returns the deleted record(s) as a DTO array, undefined if no records were found, or void if an error occurs.
   *
   * @param {Record<string, string>} key - An object representing the key used to identify the record to be deleted.
   * @returns {Promise<TemplateTimeSavings[] | undefined | void>} A promise that resolves to an array of deleted records as DTOs,
   * or undefined if no records were deleted, or void if an error occurs during the deletion process.
   * @throws {Error} Throws an error if the deletion operation fails.
   */
  async delete(
    key: Record<string, string>,
  ): Promise<TemplateTimeSavings[] | undefined | void> {
    try {
      const { client } = this.db.client.config;
      let templateTimeSavings;

      if (client === 'better-sqlite3') {
        templateTimeSavings = await this.db<TemplateTimeSavingsDbRow>(
          TIME_SAVINGS_TABLE,
        )
          .where(key)
          .select();
      }
      const result = await this.db<TemplateTimeSavingsDbRow>(TIME_SAVINGS_TABLE)
        .returning('*')
        .where(key)
        .del();

      const deletedValue =
        typeof result === 'number' ? templateTimeSavings : result;

      return this.ok<TemplateTimeSavings[] | undefined>(
        deletedValue
          ? TemplateTimeSavingsCollectionMap.toDTO(deletedValue)
          : undefined,
        'Row deleted successfully',
      );
    } catch (error) {
      return this.fail(error, 'Error deleting data. ');
    }
  }

  /**
   * Truncates the TIME_SAVINGS_TABLE, removing all records.
   *
   * This asynchronous method clears all entries from the specified table in the database.
   * It returns a success response if the truncation is successful, or an error response if the operation fails.
   *
   * @returns {Promise<boolean | void>} A promise that resolves to true if the table was truncated successfully,
   * or void if an error occurs during the truncation process.
   * @throws {Error} Throws an error if the truncation operation fails.
   */
  async truncate(): Promise<boolean | void> {
    try {
      await this.db(TIME_SAVINGS_TABLE).truncate();
      return this.ok<boolean>(true, 'Table truncated successfully');
    } catch (error) {
      return this.fail(error, 'Error truncating table');
    }
  }

  /**
   * Retrieves the template name associated with a given template task ID.
   *
   * This asynchronous method queries the TIME_SAVINGS_TABLE to find the template name
   * corresponding to the specified templateTaskId. It returns the template name if found,
   * or undefined if no matching record exists. The method handles any errors that may occur during the query.
   *
   * @param {string} templateTaskId - The ID of the template task for which the template name is to be retrieved.
   * @returns {Promise<string | undefined | void>} A promise that resolves to the template name as a string if found,
   * or undefined if no record matches the provided ID. Returns void if an error occurs during the operation.
   * @throws {Error} Throws an error if the retrieval process fails.
   */
  async getTemplateNameByTsId(
    templateTaskId: string,
  ): Promise<string | undefined | void> {
    try {
      const result = await this.db<{ template_name: string }>(
        TIME_SAVINGS_TABLE,
      )
        .select('template_name')
        .where('template_task_id', templateTaskId)
        .limit(1)
        .first();
      return this.ok<string | undefined>(
        result ? result.template_name : undefined,
        'Data selected successfully',
      );
    } catch (error) {
      return this.fail(error);
    }
  }

  /**
   * Retrieves statistics on time saved by each team for a specific template task ID.
   *
   * This asynchronous method queries the TIME_SAVINGS_TABLE to calculate the total time saved
   * by each team associated with the provided templateTaskId. The results are grouped by team,
   * and the method returns an array of time saved statistics as DTOs, or undefined if no data is found.
   *
   * @param {string} templateTaskId - The ID of the template task for which time saved statistics are to be retrieved.
   * @returns {Promise<TimeSavedStatistics[] | undefined | void>} A promise that resolves to an array of time saved statistics
   * as DTOs if records are found, or undefined if no records match the provided ID. Returns void if an error occurs during the operation.
   * @throws {Error} Throws an error if the retrieval process fails.
   */
  async getStatsByTemplateTaskId(
    templateTaskId: string,
  ): Promise<TimeSavedStatistics[] | undefined | void> {
    //  Get time saved by each team corresponding to a specific template task id
    try {
      const result = await this.db<TimeSavedStatisticsDbRow>(TIME_SAVINGS_TABLE)
        .sum({ time_saved: 'time_saved' })
        .select('team')
        .where('template_task_id', templateTaskId)
        .groupBy('team');
      return this.ok<TimeSavedStatistics[] | undefined>(
        result && result.length
          ? result.map(e => TimeSavedStatisticsMap.toDTO(e))
          : undefined,
        'Data selected successfully',
      );
    } catch (error) {
      return this.fail(error);
    }
  }

  /**
   * Retrieves statistics on time saved by each template for a specific team.
   *
   * This asynchronous method queries the TIME_SAVINGS_TABLE to calculate the total time saved
   * by each template associated with the provided team name. The results are grouped by template name
   * and team, returning an array of time saved statistics as DTOs, or undefined if no data is found.
   *
   * @param {string} team - The name of the team for which time saved statistics are to be retrieved.
   * @returns {Promise<TimeSavedStatistics[] | undefined | void>} A promise that resolves to an array of time saved statistics
   * as DTOs if records are found, or undefined if no records match the provided team name. Returns void if an error occurs during the operation.
   * @throws {Error} Throws an error if the retrieval process fails.
   */
  async getStatsByTeam(
    team: string,
  ): Promise<TimeSavedStatistics[] | undefined | void> {
    //  Get time saved by each template corresponding to a specific team name
    try {
      const result = await this.db<TimeSavedStatisticsDbRow>(TIME_SAVINGS_TABLE)
        .sum({ time_saved: 'time_saved' })
        .select('template_name', 'team')
        .where('team', team)
        .groupBy('template_name')
        .groupBy('team');
      return this.ok<TimeSavedStatistics[] | undefined>(
        result && result.length
          ? result.map(e => TimeSavedStatisticsMap.toDTO(e))
          : undefined,
        'Data selected successfully',
      );
    } catch (error) {
      return this.fail(error);
    }
  }

  /**
   * Retrieves statistics on time saved by each team for a specific template.
   *
   * This asynchronous method queries the TIME_SAVINGS_TABLE to calculate the total time saved
   * by each team associated with the provided template name. The results are grouped by team,
   * returning an array of time saved statistics as DTOs, or undefined if no data is found.
   *
   * @param {string} template - The name of the template for which time saved statistics are to be retrieved.
   * @returns {Promise<TimeSavedStatistics[] | undefined | void>} A promise that resolves to an array of time saved statistics
   * as DTOs if records are found, or undefined if no records match the provided template name. Returns void if an error occurs during the operation.
   * @throws {Error} Throws an error if the retrieval process fails.
   */
  async getStatsByTemplate(
    template: string,
  ): Promise<TimeSavedStatistics[] | undefined | void> {
    // Get time saved by each team corresponding to a specific template name
    try {
      const result = await this.db<TimeSavedStatisticsDbRow>(TIME_SAVINGS_TABLE)
        .sum({ time_saved: 'time_saved' })
        .select('team')
        .where('template_name', template)
        .groupBy('team')
        .groupBy('template_name');
      return this.ok<TimeSavedStatistics[] | undefined>(
        result && result.length
          ? result.map(e => TimeSavedStatisticsMap.toDTO(e))
          : undefined,
        'Data selected successfully',
      );
    } catch (error) {
      return this.fail(error);
    }
  }

  /**
   * Retrieves statistics on time saved by each team for all templates.
   *
   * This asynchronous method queries the TIME_SAVINGS_TABLE to calculate the total time saved
   * by each team across all templates. The results are grouped by team and template name,
   * returning an array of time saved statistics as DTOs, or undefined if no data is found.
   *
   * @returns {Promise<TimeSavedStatistics[] | undefined | void>} A promise that resolves to an array of time saved statistics
   * as DTOs if records are found, or undefined if no records exist. Returns void if an error occurs during the operation.
   * @throws {Error} Throws an error if the retrieval process fails.
   */
  async getAllStats(): Promise<TimeSavedStatistics[] | undefined | void> {
    // Get time saved by each team and template
    try {
      const result = await this.db<TimeSavedStatisticsDbRow>(TIME_SAVINGS_TABLE)
        .sum({ time_saved: 'time_saved' })
        .select('team', 'template_name')
        .groupBy('team', 'template_name');
      return this.ok<TimeSavedStatistics[] | undefined>(
        result && result.length
          ? result.map(e => TimeSavedStatisticsMap.toDTO(e))
          : undefined,
        'Data selected successfully',
      );
    } catch (error) {
      return this.fail(error);
    }
  }

  /**
   * Calculates the percentage of time savings for each team relative to the total time saved by all teams.
   *
   * This asynchronous method performs a query to compute the total time saved by each team and
   * then calculates the percentage of each team's savings compared to the overall savings.
   * The results are returned as an array of group savings division statistics as DTOs, or undefined if no data is found.
   *
   * @returns {Promise<GroupSavingsDivision[] | undefined | void>} A promise that resolves to an array of group savings division statistics
   * as DTOs if records are found, or undefined if no records exist. Returns void if an error occurs during the operation.
   * @throws {Error} Throws an error if the calculation process fails.
   */
  async getGroupSavingsDivision(): Promise<
    GroupSavingsDivision[] | undefined | void
  > {
    try {
      const subquery = this.db('ts_template_time_savings as sub')
        .select('team')
        .sum('time_saved as total_team_time_saved')
        .groupBy('team');

      const total = await this.db<{ sum: string | null }>(
        'ts_template_time_savings as total',
      )
        .sum('time_saved as sum')
        .first()
        .then(data => {
          return (data as unknown as { sum: string | null })?.sum ?? 0;
        });

      const result = await this.db<GroupSavingsDivisionDbRow>(
        'ts_template_time_savings as main',
      )
        .select('main.team')
        .innerJoin(subquery.as('sub'), 'main.team', 'sub.team')
        .select(
          'main.team',
          // TODO: ROUND(...) function fails, temporary replaced with linear calculation
          this.db.raw(
            `(sub.total_team_time_saved / ${total}) * 100 as percentage`,
          ),
        )
        .groupBy('main.team', 'sub.total_team_time_saved');

      return this.ok<GroupSavingsDivision[] | undefined>(
        result && result.length
          ? result.map(e => GroupSavingsDivisionMap.toDTO(e))
          : undefined,
        'Data selected successfully',
      );
    } catch (error) {
      return this.fail(error);
    }
  }

  /**
   * Retrieves daily time summaries of total time saved by each team.
   *
   * This asynchronous method queries the `ts_template_time_savings` table to calculate the total time saved
   * by each team, grouped by year and team. The results are ordered by date in descending order, returning
   * an array of time summary statistics as DTOs, or undefined if no data is found.
   *
   * @returns {Promise<TimeSummary[] | undefined | void>} A promise that resolves to an array of daily time summaries
   * as DTOs if records are found, or undefined if no records exist. Returns void if an error occurs during the operation.
   * @throws {Error} Throws an error if the retrieval process fails.
   */
  async getDailyTimeSummariesTeamWise(): Promise<
    TimeSummary[] | undefined | void
  > {
    //  Get total time saved by each team, grouped by year and team, in date descending order
    try {
      const formattedDate = this.formatDate(this.db, 'created_at', 'date');

      const result = await this.db<RawDbTimeSummary>('ts_template_time_savings')
        .sum({ total_time_saved: 'time_saved' })
        .select(formattedDate, 'team')
        .groupByRaw('date, team')
        .orderByRaw('date');

      return this.ok<TimeSummary[] | undefined>(
        result && result.length
          ? result.map(e => TimeSummaryMap.toDTO(e))
          : undefined,
        'Data selected successfully',
      );
    } catch (error) {
      return this.fail(error);
    }
  }

  /**
   * Retrieves daily time summaries of total time saved by each template.
   *
   * This asynchronous method queries the `ts_template_time_savings` table to calculate the total time saved
   * by each template, grouped by year and template name. The results are ordered by date in descending order,
   * returning an array of time summary statistics as DTOs, or undefined if no data is found.
   *
   * @returns {Promise<TimeSummary[] | undefined | void>} A promise that resolves to an array of daily time summaries
   * as DTOs if records are found, or undefined if no records exist. Returns void if an error occurs during the operation.
   * @throws {Error} Throws an error if the retrieval process fails.
   */
  async getDailyTimeSummariesTemplateWise(): Promise<
    TimeSummary[] | undefined | void
  > {
    //  Get total time saved by each template, grouped by year and template, in date descending order
    try {
      const formattedDate = this.formatDate(this.db, 'created_at', 'date');

      const result = await this.db<RawDbTimeSummary>('ts_template_time_savings')
        .sum('time_saved as total_time_saved')
        .select(formattedDate, 'template_name')
        .groupByRaw('date, template_name')
        .orderBy('date');

      return this.ok<TimeSummary[] | undefined>(
        result && result.length
          ? result.map(e => TimeSummaryMap.toDTO(e))
          : undefined,
        'Data selected successfully',
      );
    } catch (error) {
      return this.fail(error);
    }
  }

  /**
   * POSTGRES LOGIC IS A REFERENCE TODO:fix logic to work on SQLite
   *
   * Retrieves time summaries of total time saved by each team, grouped by date.
   *
   * This asynchronous method performs a subquery to calculate the total time saved by each team for each date,
   * and then aggregates these results to provide a summary of time saved by team on a daily basis.
   * The results are ordered by date, returning an array of time summary statistics as DTOs, or undefined if no data is found.
   *
   * @returns {Promise<TimeSummary[] | undefined | void>} A promise that resolves to an array of time summaries
   * as DTOs if records are found, or undefined if no records exist. Returns void if an error occurs during the operation.
   * @throws {Error} Throws an error if the retrieval process fails.
   */
  async getTimeSummarySavedTeamWise(): Promise<
    TimeSummary[] | undefined | void
  > {
    const { client } = this.db.client.config;
    try {
      let result;
      if (client === 'pg') {
        result = await this.db<RawDbTimeSummary>('ts_template_time_savings')
          .select(
            this.db.raw(
              'DISTINCT ON (team, DATE(created_at)) DATE(created_at) AS formatted_date',
            ),
            this.db.raw('DATE(created_at) AS date'),
            'team',
            this.db.raw(
              'SUM(time_saved) OVER (PARTITION BY team ORDER BY DATE(created_at)) AS total_time_saved',
            ),
          )
          .orderBy('team')
          .orderByRaw('DATE(created_at)')
          .orderBy('created_at');
      } else {
        const subquery = this.db('ts_template_time_savings as sub')
          .select(
            'team',
            this.db.raw(`DATE(created_at) as date`),
            this.db.raw('SUM(time_saved) as total_time_saved'),
          )
          .groupBy('template_name', 'date', 'team');

        result = await this.db<RawDbTimeSummary>(subquery.as('temp'))
          .select(
            'date',
            'team',
            this.db.raw('SUM(total_time_saved) as total_time_saved'),
          )
          .groupBy('team', 'date')
          .orderBy('date');
      }

      return this.ok<TimeSummary[] | undefined>(
        result && result.length
          ? result.map(e => TimeSummaryMap.toDTO(e))
          : undefined,
        'Data selected successfully',
      );
    } catch (error) {
      return this.fail(error);
    }
  }

  /**
   * POSTGRES LOGIC IS A REFERENCE TODO:fix logic to work on SQLite
   *
   * Retrieves time summaries of total time saved by each template, grouped by date.
   *
   * This asynchronous method performs a subquery to calculate the total time saved for each template on each date,
   * aggregating the results to provide a summary of time saved by template on a daily basis.
   * The results are ordered by date, returning an array of time summary statistics as DTOs, or undefined if no data is found.
   *
   * @returns {Promise<TimeSummary[] | undefined | void>} A promise that resolves to an array of time summaries
   * as DTOs if records are found, or undefined if no records exist. Returns void if an error occurs during the operation.
   * @throws {Error} Throws an error if the retrieval process fails.
   */
  async getTimeSummarySavedTemplateWise(): Promise<
    TimeSummary[] | undefined | void
  > {
    const { client } = this.db.client.config;
    let result;
    try {
      if (client === 'pg') {
        result = await this.db<RawDbTimeSummary>('ts_template_time_savings')
          .select(
            this.db.raw(
              'DISTINCT ON (template_name, DATE(created_at)) DATE(created_at) AS formatted_date',
            ),
            this.db.raw('DATE(created_at) AS date'),
            'template_name',
            this.db.raw(
              'SUM(time_saved) OVER (PARTITION BY template_name ORDER BY DATE(created_at)) AS total_time_saved',
            ),
          )
          .orderBy('template_name')
          .orderByRaw('DATE(created_at)')
          .orderBy('created_at');
      } else {
        const subquery = this.db<RawDbTimeSummary>(
          'ts_template_time_savings as sub',
        )
          .select(
            'template_name',
            this.db.raw(`DATE(created_at) as date`),
            this.db.raw('SUM(time_saved) as total_time_saved'),
          )
          .groupBy('template_name', 'date');

        result = await this.db
          .select(
            'date',
            'template_name',
            this.db.raw('SUM(total_time_saved) as total_time_saved'),
          )
          .from(subquery.as('temp'))
          .groupBy('template_name', 'date')
          .orderBy('date');
      }
      return this.ok<TimeSummary[] | undefined>(
        result && result.length
          ? result.map(e => TimeSummaryMap.toDTO(e))
          : undefined,
        'Data selected successfully',
      );
    } catch (error) {
      return this.fail(error);
    }
  }

  /**
   * Retrieves distinct values from a specified column in the TIME_SAVINGS_TABLE.
   *
   * This asynchronous method queries the database to obtain unique entries from the specified column.
   * The results are then mapped to a DTO format for easier consumption. The method returns an object containing
   * the distinct values or undefined if no data is found.
   *
   * @param {string} column - The name of the column from which to retrieve distinct values.
   * @returns {Promise<{ [x: string]: (string | number)[] } | undefined | void>} A promise that resolves to an object containing
   * distinct values from the specified column, or undefined if no records exist. Returns void if an error occurs during the operation.
   * @throws {Error} Throws an error if the retrieval process fails.
   */
  async getDistinctColumn(
    column: string,
  ): Promise<{ [x: string]: (string | number)[] } | undefined | void> {
    try {
      const result: TemplateTimeSavingsDistinctRbRow[] = await this.db(
        TIME_SAVINGS_TABLE,
      ).distinct(column);

      return this.ok<{ [x: string]: (string | number)[] } | undefined>(
        TemplateTimeSavingsCollectionMap.distinctToDTO(result),
        'Data selected successfully',
      );
    } catch (error) {
      return this.fail(error);
    }
  }

  /**
   * Retrieves the count of distinct template task IDs in the TIME_SAVINGS_TABLE.
   *
   * This asynchronous method queries the database to count the unique template task IDs present in the specified table.
   * It returns the count as a number, defaulting to zero if no templates are found. The method handles any errors that may occur during the query.
   *
   * @returns {Promise<number | void>} A promise that resolves to the count of distinct template task IDs,
   * or zero if no records exist. Returns void if an error occurs during the operation.
   * @throws {Error} Throws an error if the retrieval process fails.
   */
  async getTemplateCount(): Promise<number | void> {
    try {
      const result = await this.db(TIME_SAVINGS_TABLE)
        .countDistinct('template_task_id as count')
        .first();

      let count = 0;

      if (result?.count && !isNaN(1 * (result.count as number))) {
        count = 1 * (result.count as number);
      }

      return this.ok<number>(count, 'Data selected successfully');
    } catch (error) {
      return this.fail(error);
    }
  }

  /**
   * Calculates the total sum of values in a specified column from the TIME_SAVINGS_TABLE.
   *
   * This asynchronous method queries the database to compute the sum of the values in the given column.
   * It returns the total sum as a number, defaulting to zero if no values are found. The method also handles
   * any errors that may occur during the query execution.
   *
   * @param {string} column - The name of the column for which the sum of values is to be calculated.
   * @returns {Promise<number | void>} A promise that resolves to the total sum of the specified column,
   * or zero if no records exist. Returns void if an error occurs during the operation.
   * @throws {Error} Throws an error if the retrieval process fails.
   */
  async getTimeSavedSum(): Promise<number | void> {
    try {
      const result = await this.db<{ sum: number }>(TIME_SAVINGS_TABLE)
        .sum({ sum: 'time_saved' })
        .first();

      return this.ok<number>(result?.sum || 0, 'Data selected successfully');
    } catch (error) {
      return this.fail(error);
    }
  }

  /**
   * @description Retrieves tasks ids from the EXCLUDED_TASKS_TABLE. These tasks are not used for Timesaver calculations.
   *
   * @returns {Promise<string[] | undefined>} A promise resolves executions ids, which should be filtered out in timesavings
   */
  async getTasksToExclude(): Promise<string[] | undefined | void> {
    try {
      const result = await this.db<string[]>(EXCLUDED_TASKS_TABLE).select(
        'task_id',
      );

      const output: string[] | undefined =
        result && result.length > 0
          ? result.map(item => item.task_id)
          : undefined;

      return this.ok(output, 'Data selected successfully');
    } catch (error) {
      return this.fail(error);
    }
  }
}
