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

  await knex.schema
    .createTable('ts_excluded_tasks_everywhere', table => {
      table.comment('Table contains task ids to be excluded from calculations');

      table
        .string('task_id')
        .primary()
        .notNullable()
        .comment('Template task ID');
    })
    .then(
      s => {
        response = {
          ...response,
          ts_excluded_tasks_everywhere: s,
        };
      },
      reason => {
        response = {
          ...response,
          ts_excluded_tasks_everywhere: `Not created: ${reason}`,
        };
        console.log('Failed to create ts_excluded_tasks_everywhere.');
      },
    );

  return response;
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  return knex.schema.dropTable('ts_excluded_tasks_everywhere');
};
