import fs from 'fs';
import AWS from 'aws-sdk';

type Error = NodeJS.ErrnoException | null;

export class Command {
  protected lambda: AWS.Lambda;

  protected lambdaRoleName = 'LambdaBlogPublisher';
  protected lambdaName = 'BlogPublisher';

  constructor() {
    this.lambda = new AWS.Lambda({
      apiVersion: '2015-03-31',
      region: process.env.WEBSITE_REGION
    });
  }

  async run() {
    console.error('run() method should be present in command class');
  }

  protected async getFunctionCode(): Promise<Buffer> {

    return this.getFile('/tmp/lambda.blog-publisher.zip');
  }

  protected async getDependencies(): Promise<Buffer> {

    return this.getFile('/tmp/dependencies.zip');
  }

  protected async getFile(path: string): Promise<Buffer> {

    return new Promise((resolve, reject) => {

      fs.readFile(path, (err: Error, data: Buffer) => err ? reject(err) : resolve(data));
    })
  }
}
