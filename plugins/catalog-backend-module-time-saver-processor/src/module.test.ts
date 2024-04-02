import { catalogProcessingExtensionPoint } from "@backstage/plugin-catalog-node/alpha";
import { TimeSaverProcessor } from "./processor";
import { catalogModuleTimeSaverProcessor } from "./module";
import { startTestBackend } from "@backstage/backend-test-utils";

describe("catalogModuleTimeSaverProcessor", () => {
  it("should register the extension point", async () => {
    const extensionPoint = { addProcessor: jest.fn() };
    await startTestBackend({
      extensionPoints: [[catalogProcessingExtensionPoint, extensionPoint]],
      features: [catalogModuleTimeSaverProcessor()],
    });

    expect(extensionPoint.addProcessor).toHaveBeenCalledWith(
      new TimeSaverProcessor()
    );
  });
});
