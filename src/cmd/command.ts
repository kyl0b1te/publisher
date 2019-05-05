import fs from 'fs';
import AWS from 'aws-sdk';

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

    return new Promise((resolve, reject) => {

      fs.readFile('/tmp/lambda.blog-publisher.zip', (err: NodeJS.ErrnoException | null, data: Buffer) => {

        return err ? reject(err) : resolve(data);
      });
    })
  }
}
