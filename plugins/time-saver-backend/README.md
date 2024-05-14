# Time Saver - backend

This plugin provides an implementation of charts and statistics related to your time savings that are coming from usage of your templates. Plugins is built from frontend and backend part. Backend plugin is responsible for scheduled stats parsing process and data storage.

## Dependencies

- [time-saver](https://github.com/tduniec/backstage-timesaver-plugin/tree/main/plugins/time-saver)
- [time-saver-common](https://github.com/tduniec/backstage-timesaver-plugin/tree/main/plugins/time-saver-common)

## Code

https://github.com/tduniec/backstage-timesaver-plugin.git

## Installation

1. Install the plugin package in your Backstage app:

```sh
# From your Backstage root directory
yarn add --cwd packages/backend @tduniec/backstage-plugin-time-saver-backend
```

2. Wire up the API implementation to your App in `timeSaver.ts` file in `packages/backend/src/plugins/`:

```ts
import { createRouter } from '@tduniec/backstage-plugin-time-saver-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    database: env.database,
    config: env.config,
    scheduler: env.scheduler,
  });
}
```

in `packages/backend/src/index.ts`

```ts

import timeSaver from './plugins/timeSaver';

...

const timeSaverEnv = useHotMemoize(module, () => createEnv('timesaver'));

...

apiRouter.use('/time-saver', await timeSaver(timeSaverEnv)); // you should use authMiddleware if you are using it for backend

```

3. Generate and specify a static token for communication with the scaffold using service-to-service authentication. This can be retrieved using the subject `time-saver` with the configuration object.

```yaml
backend:
  auth:
    externalAccess:
      ...
      - type: static
        options:
          token: ${TIME_SAVER_AUTH_TOKEN}
          subject: time-saver
```

### New Backend - instalation

2. Wire up the plugin in Backstage new backend system

in `packages/backend/src/index.ts`

```ts
backend.add(import('@tduniec/backstage-plugin-time-saver-backend'));
```

3. Install [time-saver](../time-saver/README.md) part if not installed already

## Generate Statistics

Configure your template definition like described below:
Provide an object under `metadata`. Provide quantities of saved time by each group executing one template in **_hours_** preferably

```diff
 apiVersion: scaffolder.backstage.io/v1beta3
 kind: Template
 metadata:
     name: example-template
     title: create-github-project
     description: Creates Github project
+      substitute:
+        engineering:
+          devops: 1
+          security: 4
+          development_team: 2
 spec:
     owner: group:default/backstage-admins
     type: service
```

Scheduler is running with its default setup every **5 minutes** to generate data from executed templates with these information.

## Optional configuration

If your backend deployment is separate from your frontend you can use below config to override the setup

```yaml
ts:
  backendUrl: https://my-awesome-backstage.com
```

## Migration

This plugins supports backward compatibility with migration. You can specify your Time Saver metadata for each template name. Then the migration will be performed once executing the API request to `/migrate` endpoint of the plugin.

Configure your backward time savings here:

Open the `app-config.yaml` file

```yaml
ts:
  backward:
    config: |
      [
        {
          "entityRef": "template:default/create-github-project",
          "engineering": {
            "devops": 8,
            "development_team": 8,
            "security": 3
          }
        } 
      ]
    # extend this list if needed
```
