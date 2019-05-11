import fs from 'fs';
import { exec, ExecException } from 'child_process';

import { AWSError } from 'aws-sdk';
import S3 from 'aws-sdk/clients/s3';

export class Publisher {

  private srcArchivePath = '/tmp/src.zip';

  public constructor(
    private s3KeyParams: S3.GetObjectRequest,
    private s3Client: S3
  ) { }

  public async loadTo(srcPath: string): Promise<boolean> {

    try {
      const data = await this.load();
      await this.save(this.srcArchivePath, data);

      return await this.unpack(this.srcArchivePath, srcPath);
    } catch (err) {

      return Promise.resolve(false);
    }
  }

  public makeStaticFrom(srcPath: string, website: string, theme: string): Promise<boolean> {

    return this.execute(`hugo -s ${srcPath} -b ${website} -t ${theme}`);
  }

  public deployFrom(srcPath: string): Promise<boolean> {

    return this.execute('bsync -config=env -aws-auth=false')
      .then((): Promise<boolean> => this.execute(`rm -rf ${srcPath}`));
  }

  private load(): Promise<S3.Body> {

    return new Promise((resolve, reject): void => {

      this.s3Client.getObject(
        this.s3KeyParams,
        (err: AWSError, data: S3.GetObjectOutput): void => {

          err != null ? reject(err) : resolve(data.Body);
        }
      );
    });
  }

  private save(tmpFilePath: string, data: S3.Body): Promise<string> {

    return new Promise((resolve, reject): void => {

      fs.writeFile(tmpFilePath, data, (err): void => {

        err ? reject(err) : resolve(tmpFilePath);
      });
    });
  }

  private unpack(tmpFilePath: string, srcPath: string): Promise<boolean> {

    return this.execute(`unzip -o -q ${tmpFilePath} -d ${srcPath}`)
      .then((): Promise<boolean> => this.execute(`rm ${tmpFilePath}`));
  }

  private execute(command: string): Promise<boolean> {

    return new Promise((resolve, reject): void => {

      exec(command, (error: ExecException | null, stdout: string, stderr: string): void => {

        if (stdout !== '') {
          console.log(`stdout: ${stdout}`);
        }

        if (stderr !== '') {
          console.log(`stderr: ${stderr}`);
        }

        error != null ? reject(error) : resolve(true);
      });
    });
  }
}
