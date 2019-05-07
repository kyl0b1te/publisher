import { Command } from './command';
import { Lambda, AWSError } from 'aws-sdk';

export class UpdateCommand extends Command {

  async run() {

    await this.updateCode();
  }

  private async updateCode(): Promise<boolean> {

    return new Promise(async (resolve, reject) => {

      const params: Lambda.UpdateFunctionCodeRequest = {
        FunctionName: this.lambdaName,
        ZipFile: await this.getFunctionCode()
      };

      this.lambda.updateFunctionCode(params, (err: AWSError) => {

        return err ? reject(err) : resolve(true);
      });
    })
  }
}
