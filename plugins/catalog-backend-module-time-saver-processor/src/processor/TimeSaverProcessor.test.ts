import { Entity } from '@backstage/catalog-model';
import { TimeSaverProcessor } from './TimeSaverProcessor';

function copy(entity: Entity): Entity {
  return JSON.parse(JSON.stringify(entity));
}

describe('TimeSaverProcessor', () => {
  let processorUnderTest: TimeSaverProcessor;

  beforeEach(() => {
    processorUnderTest = new TimeSaverProcessor();
  });

  it('returns expected processor name', () => {
    expect(processorUnderTest.getProcessorName()).toEqual('TimeSaverProcessor');
  });

  it('appends expected time-saved annotation', async () => {
    const expectedEntity = {
      apiVersion: '1',
      kind: 'Template',
      metadata: {
        name: 'anything',
        substitute: {
          engineering: {
            devops: 8,
            security: 2,
          },
        },
      },
    };
    const entity = await processorUnderTest.preProcessEntity(
      copy(expectedEntity),
    );
    expect(entity).toEqual({
      apiVersion: '1',
      kind: 'Template',
      metadata: {
        name: 'anything',
        annotations: {
          'backstage.io/time-saved': 'PT10H',
        },
        substitute: {
          engineering: {
            devops: 8,
            security: 2,
          },
        },
      },
    });
  });

  it('does not modify entity with no time-saver metadata', async () => {
    const expectedEntity = {
      apiVersion: '1',
      kind: 'Template',
      metadata: {
        name: 'anything',
      },
    };
    const entity = await processorUnderTest.preProcessEntity(
      copy(expectedEntity),
    );
    expect(entity).toEqual(expectedEntity);
  });

  it('does not modify non-template entity', async () => {
    const expectedEntity = {
      apiVersion: '1',
      kind: 'Component',
      metadata: {
        name: 'anything',
        substitute: {
          engineering: {
            devops: 8,
            security: 2,
          },
        },
      },
    };
    const entity = await processorUnderTest.preProcessEntity(
      copy(expectedEntity),
    );
    expect(entity).toEqual(expectedEntity);
  });

  it('does not modify entity that already has time-saved annotation', async () => {
    const expectedEntity = {
      apiVersion: '1',
      kind: 'Template',
      metadata: {
        name: 'anything',
        annotations: {
          'backstage.io/time-saved': 'PT1D',
        },
        substitute: {
          engineering: {
            devops: 8,
            security: 2,
          },
        },
      },
    };
    const entity = await processorUnderTest.preProcessEntity(
      copy(expectedEntity),
    );
    expect(entity).toEqual(expectedEntity);
  });

  it('does not modify entity with zero hours saved', async () => {
    const expectedEntity = {
      apiVersion: '1',
      kind: 'Template',
      metadata: {
        name: 'anything',
        substitute: {
          engineering: {},
        },
      },
    };
    const entity = await processorUnderTest.preProcessEntity(
      copy(expectedEntity),
    );
    expect(entity).toEqual(expectedEntity);
  });
});
