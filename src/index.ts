import { Sources } from './sources';

export async function publish(): Promise<void> {

  const sources = new Sources({
    // todo : get from ENV
    Bucket: 'src-zhikiri.info',
    Key: 'zhikiri.info.zip'
  });

  const tmpSourcePath = '/tmp/src';

  let ok = await sources.loadTo(tmpSourcePath);
  console.log(`Finished with status: ${ok}`);

  if (ok) {
    sources.makeStaticFrom(tmpSourcePath);
  }
}
