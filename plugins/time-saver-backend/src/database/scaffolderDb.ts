// @ts-nocheck
import { Config } from "@backstage/config";
import Knex from "knex";

export class ScaffolderDb {
  constructor(private readonly config: Config) {}

  private readonly scaffolderDbName = "backstage_plugin_scaffolder";

  scaffolderKnex() {
    const dbConfig: any = this.config.getOptional("backend.database");

    if (dbConfig) {
      const knex: knex<any, any[]> = Knex({
        client: dbConfig.client,
        connection: {
          host: dbConfig.connection.host,
          port: dbConfig.connection.port,
          user: dbConfig.connection.user,
          password: dbConfig.connection.password,
          database:
            dbConfig.pluginDivisionMode === "schema"
              ? dbConfig.connection.database
              : this.scaffolderDbName,
          ssl: dbConfig.connection.ssl?.ca
            ? { rejectUnauthorized: false }
            : false,
        },
        searchPath:
          dbConfig.pluginDivisionMode === "schema" ? ["scaffolder"] : undefined,
      });
      return knex;
    }
  }
}
