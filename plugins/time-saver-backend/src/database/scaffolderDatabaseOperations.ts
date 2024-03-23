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
        { templateTaskId }
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
