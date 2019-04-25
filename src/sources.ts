import fs from 'fs';
import { spawn } from 'child_process';

import { AWSError } from 'aws-sdk';
import S3 from 'aws-sdk/clients/s3';

export class Sources {

  constructor(
    private s3KeyParams: S3.GetObjectRequest,
    private s3Config: S3.ClientConfiguration = { apiVersion: '2006-03-01' }
  ) { }

  async loadTo(srcPath: string): Promise<boolean> {

    const tmpFileName = '/tmp/src.zip';

    try {
      const data = await this.load();
      await this.save(tmpFileName, data);

      return await this.unpack(tmpFileName, srcPath);
    } catch (err) {
      console.error(err);

      return Promise.resolve(false);
    }
  }

  makeStaticFrom(srcPath: string) {

  }

  private load(): Promise<S3.Body> {

    return new Promise((resolve, reject) => {

      const s3Client = new S3(this.s3Config);
      s3Client.getObject(this.s3KeyParams, (err: AWSError, data: S3.GetObjectOutput) => {

        if (err != null) {
          return reject(err);
        }
        resolve(data.Body);
      });
    });
  }

  private save(tmpFilePath: string, data: S3.Body): Promise<string> {

    return new Promise((resolve, reject) => {

      fs.writeFile(tmpFilePath, data, (err) => {

        return err ? reject(err) : resolve(tmpFilePath);
      });
    });
  }

  private unpack(tmpFilePath: string, srcPath: string): Promise<boolean> {

    return new Promise((resolve) => {

      const chProcess = spawn('unzip', ['-q', tmpFilePath, '-d', srcPath]);
      chProcess.on('exit', async (code: number) => {

        return resolve(
          code === 0 ? await this.cleanUp(tmpFilePath) : false
        );
      });
    });
  }

  private cleanUp(tmpFilePath: string): Promise<boolean> {

    return new Promise((resolve) => {
      spawn('rm', [tmpFilePath]).on('exit', (code: number) => resolve(code === 0));
    });
  }
}
