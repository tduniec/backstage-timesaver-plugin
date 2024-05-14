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
import { Logger } from 'winston';
import jwt from 'jsonwebtoken';
import * as base64 from 'base64-js';

export class ScaffolderClient {
  constructor(
    private readonly logger: Logger,
    private readonly config: Config,
  ) {}

  async fetchTemplatesFromScaffolder() {
    let backendUrl =
      this.config.getOptionalString('ts.backendUrl') ?? 'http://127.0.0.1:7007';
    backendUrl = backendUrl.replace(
      /(http:\/\/)localhost(:\d+)/g,
      '$1127.0.0.1$2',
    ); // This changes relates to local setup since there is ERRCONREFUSSED using localhost
    const templatePath = '/api/scaffolder/v2/tasks';
    const callUrl = `${backendUrl}${templatePath}`;

    let templateTaskList = [];
    try {
      const response = await fetch(callUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${await this.generateBackendToken(
            this.config,
            'backstage-server',
          )}`,
        },
      });
      this.logger.debug(JSON.stringify(response));
      const data = await response.json();
      templateTaskList = data.tasks;
    } catch (error) {
      this.logger.error(
        `Problem retrieving response from url: ${callUrl}`,
        error,
      );
      return [];
    }
    return templateTaskList;
  }

  async generateBackendToken(config: Config, name?: string) {
    let key: string = '';
    let decodedBytes: Buffer | string = '';
    const keyConfig:
      | { type: string; options: { token: string; subject: string } }[]
      | undefined = config.getOptional('backend.auth.externalAccess');

    keyConfig?.forEach(item => {
      if (item.options.subject === 'time-saver') {
        key = item.options.token;
      }
    });

    if (key !== '') {
      decodedBytes = this.isBase64(key) ? this.decodeFromBase64(key) : key;
    } else {
      decodedBytes = '';
    }

    const tokenSub = name ?? 'backstage-server';
    const payload = {
      sub: tokenSub,
      exp: Math.floor(Date.now() / 1000) + 3600, // Current timestamp + 1 hours in seconds
    };

    return jwt.sign(payload, decodedBytes, { algorithm: 'HS256' });
  }

  isBase64(value: string): boolean {
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/.test(
      value,
    );
  }
  decodeFromBase64(input: string): Buffer {
    return Buffer.from(base64.toByteArray(input));
  }
}
