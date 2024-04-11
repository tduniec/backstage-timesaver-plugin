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
import { Config } from '@backstage/config';
import Knex from 'knex';

export interface SSLParameters {
  ca: string;
}
export interface DatabaseConnection {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: SSLParameters;
}
export interface DatabaseConfiguration {
  client: string;
  connection: DatabaseConnection;
  pluginDivisionMode: string;
}

export class ScaffolderDb {
  constructor(private readonly config: Config) {}

  private readonly scaffolderDbName = 'backstage_plugin_scaffolder';

  scaffolderKnex() {
    const dbConfig: DatabaseConfiguration | undefined =
      this.config.getOptional('backend.database');

    if (dbConfig) {
      const knex: Knex.Knex = Knex({
        client: dbConfig.client,
        connection: {
          host: dbConfig.connection.host,
          port: dbConfig.connection.port,
          user: dbConfig.connection.user,
          password: dbConfig.connection.password,
          database:
            dbConfig.pluginDivisionMode === 'schema'
              ? dbConfig.connection.database
              : this.scaffolderDbName,
          ssl: dbConfig.connection.ssl?.ca
            ? { rejectUnauthorized: false }
            : false,
        },
        searchPath:
          dbConfig.pluginDivisionMode === 'schema' ? ['scaffolder'] : undefined,
      });
      return knex;
    }
    return null;
  }
}
