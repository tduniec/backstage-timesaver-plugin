import { createBackendModule } from "@backstage/backend-plugin-api";
import { catalogProcessingExtensionPoint } from "@backstage/plugin-catalog-node/alpha";
import { TimeSaverProcessor } from "./processor/TimeSaverProcessor";

export const catalogModuleTimeSaverProcessor = createBackendModule({
  pluginId: "catalog",
  moduleId: "time-saver-processor",
  register(env) {
    env.registerInit({
      deps: { catalog: catalogProcessingExtensionPoint },
      async init({ catalog }) {
        catalog.addProcessor(new TimeSaverProcessor());
      },
    });
  },
});
