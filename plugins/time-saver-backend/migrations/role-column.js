/*
 * Copyright 2020 The Backstage Authors
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

// @ts-check

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  let response = {};

  const noColumn = await knex.schema
    .hasColumn('ts_template_time_savings', 'role')
    .then(exists => !exists);

  if (noColumn) {
    await knex.schema
      .table('ts_template_time_savings', table => {
        table.string('role').comment('Developer`s role within the team');
      })
      .then(
        s => {
          response = {
            ...response,
            ts_template_time_savings: s,
          };
        },
        reason => {
          response = {
            ...response,
            ts_template_time_savings: `Column ROLE was not created: ${reason}`,
          };
          console.log(
            'Failed to create ROLE column in ts_template_time_savings.',
          );
        },
      );
  }

  return response;
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  return knex.schema.dropTable('ts_template_time_savings');
};
