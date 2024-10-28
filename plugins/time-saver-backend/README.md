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

### New Backend - instalation

1. Wire up the plugin in Backstage new backend system

in `packages/backend/src/index.ts`

```ts
backend.add(import('@tduniec/backstage-plugin-time-saver-backend'));
```

2. Install [time-saver](../time-saver/README.md) part if not installed already

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

If you want to use configurable **scheduler** [Optional]:

```yaml
ts:
  scheduler:
    handler:
      frequency: 'PT1H' # Frequency in ISO 8601 duration format
      timeout: 'PT10M' # Timeout in ISO 8601 duration format
      initialDelay: 'PT1M' # Initial delay in ISO 8601 duration format
```

Default scheduler config: (frequency: 5M, timeout: 30M, initialDelay: 30S) can be overwritten by the above optional config.

## Migration

This plugins supports backward compatibility with migration. You can specify your Time Saver metadata for each template name. Then the migration will be performed once executing the API request to `/migrate` endpoint of the plugin.

### Setup

The configuration could be setup in 2 different ways: either using the app-config file or directly making a POST request to /migrate. Either way, a response in JSON format like the following will be sent back:

```json
{
  "updatedTemplates": {
    "total": 2,
    "list": [
      "template:default/create-github-project",
      "template:default/create-golang-project"
    ]
  },
  "missingTemplates": {
    "total": 1,
    "list": ["template:default/create-perfect-world"]
  }
}
```

where `updatedTemplates` are the correlated templates found in the scaffolder tasks database and `missingTemplates` are the ones not found.

#### a) Migration classification through app-config file

Add the following to your `app-config.yaml` file:

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

**Note: In order for your new classification to take effect, you'll need to redeploy.**

#### b) Migration classification through /migrate POST API call

Use any endpoint testing tool like [curl](https://curl.se/), [postman](https://www.postman.com/) or [thunder client](https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client) and send your new configuration in a POST request body as a JSON object. Make sure your POST request is using `Content-Type: application/json` headers.

Example:

```json
[
  {
    "entityRef": "template:default/create-github-project",
    "engineering": {
      "devsecops": 3,
      "developer": 1
    }
  },
  {
    "entityRef": "template:default/create-golang-project",
    "engineering": {
      "devsecops": 1,
      "developer": 2
    }
  }
  // extend this list if needed
]
```

Using curl:

```shell
curl --header "Content-Type: application/json" \
  --request POST \
  --data '[{"entityRef":"template:default/create-github-project","engineering":{"devsecops":3,"developer":1}},{"entityRef":"template:default/create-golang-project","engineering":{"devsecops":1,"developer":2}}]' \
  http://localhost:7007/api/time-saver/migrate
```

### Sample Classification Configuration Generation API

You can also use Time Saver backend API to generate a sample configuration file based on different parameters. You'll get a response similar to the following:

```JSON
{
  "status": "OK",
  "data": [
    {
      "entityRef": "template:default/create-github-project",
      "engineering": {
        "devops": 8,
        "development_team": 8,
        "security": 3
      }
    },
    {
      "entityRef": "template:default/create-nodejs-service",
      "engineering": {
        "devops": 8,
        "development_team": 8,
        "security": 3
      }
    },
    {
      "entityRef": "template:default/create-golang-service",
      "engineering": {
        "devops": 8,
        "development_team": 8,
        "security": 3
      }
    }
  ]
}
```

#### a) Generating a sample classification configuration through a GET request

Using nothing but your browser, you can get a sample configuration like the one above. There's also the option to use the GET parameter `useScaffolderTasksEntries` with a boolean value to retrieve a list of template tasks in the scaffolder database. Otherwise, a sample list will be used to apply a sample classification.

Example using cURL:

```shell
curl http://localhost:7007/api/time-saver/generate-sample-classification?useScaffolderTasksEntries=true
```

Example response:

```JSON
{
  "status": "OK",
  "data": [
    {
      "entityRef": "a20f844a-95c6-4844-9c42-9c4120349016",
      "engineering": {
        "devops": 8,
        "development_team": 8,
        "security": 3
      }
    }
  ]
}
```

#### b) Generating a sample classification configuration through a POST request

You can also provide a sample configuration to be applied to either a pre-defined list of template tasks or a list from the scaffolder database. You must sent the following JSON object inside a POST body request:

```JSON
{
  "customClassificationRequest": {
    "engineering": {
      "architecture": 1
    }
  },
  "options": {
    "useScaffolderTasksEntries": true
  }
}
```

Both fields are optional. If no JSON object is sent, a similar reponse to that of a GET request will be obtained.

Example using curl:

```shell
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"customClassificationRequest":{"engineering":{"architecture":1}},"options":{"useScaffolderTasksEntries":true}}' \
  http://localhost:7007/api/time-saver/generate-sample-classification
```

### Excluding template executions from TS calculations

if there is a need to exclude some of the template tasks in calculations there is a table **'ts_exclude_tasks_everywhere'** which conatins a list of **task_id**'s that need to be excluded. You can exclude tasks by appending the table in DB.
