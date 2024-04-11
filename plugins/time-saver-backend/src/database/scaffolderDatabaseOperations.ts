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
import { Knex } from 'knex';
import { Logger } from 'winston';

export class ScaffolderDatabaseOperations {
  constructor(private readonly knex: Knex, private readonly logger: Logger) {}

  async collectSpecByTemplateId(templateTaskId: string) {
    try {
      const result = await this.knex.raw(
        `
            select spec from tasks where id=:templateTaskId
            `,
        { templateTaskId },
      );
      const rows = result.rows[0];
      this.logger.debug(`Data selected successfully ${JSON.stringify(rows)}`);
      return rows;
    } catch (error) {
      this.logger.error('Error selecting data:', error);
      throw error;
    }
  }

  async updateTemplateTaskById(templateTaskId: string, data: string) {
    try {
      await this.knex('tasks')
        .where({ id: templateTaskId })
        .update({ spec: data });
      this.logger.debug(`Data selected successfully `);
      return;
    } catch (error) {
      this.logger.error('Error selecting data:', error);
      throw error;
    }
  }
}
