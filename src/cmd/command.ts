import AWS, { Lambda } from 'aws-sdk';

export class Command {
  protected lambda: AWS.Lambda;
  protected env: Lambda.EnvironmentVariables = {};

  constructor() {
    this.lambda = new AWS.Lambda({
      apiVersion: '2015-03-31',
      region: process.env.WEBSITE_REGION
    });
  }

  setEnv(env: Lambda.EnvironmentVariables) {
    delete env['AWS_ACCESS_KEY_ID'];
    delete env['AWS_SECRET_ACCESS_KEY'];
    this.env = env;
  }

  async run() {
    console.error('run() method should be present in command class');
  }
}
