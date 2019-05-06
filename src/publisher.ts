import fs from 'fs';
import { exec, ExecException } from 'child_process';

import { AWSError } from 'aws-sdk';
import S3 from 'aws-sdk/clients/s3';

export class Publisher {

  private srcArchivePath = '/tmp/src.zip';

  constructor(
    private s3KeyParams: S3.GetObjectRequest,
    private s3Config: S3.ClientConfiguration = { apiVersion: '2006-03-01' }
  ) { }

  async loadTo(srcPath: string): Promise<boolean> {

    try {
      const data = await this.load(this.s3KeyParams, this.s3Config);
      await this.save(this.srcArchivePath, data);

      return await this.unpack(this.srcArchivePath, srcPath);
    } catch (err) {

      return Promise.resolve(false);
    }
  }

  makeStaticFrom(srcPath: string, website: string, theme: string): Promise<boolean> {

    return this.execute(`./bin/hugo -s ${srcPath} -b ${website} -t ${theme}`);
  }

  deployFrom(srcPath: string): Promise<boolean> {

    return this.execute('./bin/bsync -config=env -aws-auth=false')
      .then(() => this.execute(`rm -rf ${srcPath}`));
  }

  private load(params: S3.GetObjectRequest, config: S3.ClientConfiguration): Promise<S3.Body> {

    return new Promise((resolve, reject) => {

      (new S3(config)).getObject(params, (err: AWSError, data: S3.GetObjectOutput) => {

        return err != null ? reject(err) : resolve(data.Body);
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

    return this.execute(`unzip -o -q ${tmpFilePath} -d ${srcPath}`)
      .then(() => this.execute(`rm ${tmpFilePath}`));
  }

  private execute(command: string): Promise<boolean> {

    return new Promise((resolve, reject) => {

      exec(command, (error: ExecException | null, stdout: string, stderr: string) => {

        if (stdout !== '') {
          console.log(`stdout: ${stdout}`);
        }

        if (stderr !== '') {
          console.log(`stderr: ${stderr}`);
        }

        return error != null ? reject(error) : resolve(true);
      });
    });
  }
}
