import process from 'process';

import { Publisher } from './publisher';

const env = (key: string): string => {

  const value = process.env[key];
  if (!value) {

    throw new Error(`Env variable isn't set: ${key}`);
  }

  return value;
};

const stopOnFail = (status: boolean, failMessage: string): void => {

  if (!status) {
    throw new Error(`[ERROR]: ${failMessage}`);
  }
}

export async function publish(): Promise<void> {

  const publisher = new Publisher({
    Bucket: env('SOURCE_BUCKET'),
    Key: env('SOURCE_FILENAME'),
  });

  const tmpSourcePath = '/tmp/src';

  const loaded = await publisher.loadTo(tmpSourcePath);
  stopOnFail(loaded, 'Source file loading failed');
  console.log('Source files was loaded');

  const generated = await publisher.makeStaticFrom(
    tmpSourcePath,
    env('WEBSITE_URL'),
    env('WEBSITE_THEME')
  );
  stopOnFail(generated, 'Static content generation failed');
  console.log('Static content was generated');

  const deployed = await publisher.deployFrom(tmpSourcePath);
  stopOnFail(deployed, 'Static content deployment failed');
  console.log('Changes was deployed');

  return Promise.resolve();
}
