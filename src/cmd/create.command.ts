import fs from 'fs';
import { Lambda, AWSError, IAM, S3 } from 'aws-sdk';

import { Command } from './command';

interface Entity {
  arn: string,
  name: string
}

export class CreateCommand extends Command {

  private lambdaRoleName = 'LambdaBlogPublisher';
  private lambdaName = 'BlogPublisher';

  private iam: IAM;
  private s3: S3;

  constructor() {
    super();
    this.iam = new IAM();
    this.s3 = new S3();
  }

  async run(): Promise<any> {

    // const role = { arn: 'arn:aws:iam::702171958721:role/LambdaBlogPublisher', name: this.lambdaRoleName };
    const role = await this.createRole();

    await this.setRolePolicy(role.name);

    // const lambda = { arn: 'arn:aws:lambda:eu-west-1:702171958721:function:BlogPublisher', name: this.lambdaName };
    const lambda = await this.createLambda(role.arn);
    await this.setLambdaPermissions(lambda);
    await this.setBucketNotifications(lambda);
  }

  private async createRole(): Promise<Entity> {

    return new Promise((resolve, reject) => {

      const policy = this.getRoleTrustedPolicy();

      const params: IAM.CreateRoleRequest = {
        AssumeRolePolicyDocument: JSON.stringify(policy),
        RoleName: this.lambdaRoleName,
        Path: '/'
      };

      return this.iam.createRole(params, (err: AWSError, data: IAM.CreateRoleResponse) => {

        if (err) {
          return reject(err);
        }

        return resolve({
          arn: data.Role.Arn,
          name: data.Role.RoleName
        });
      });
    });
  }

  private getRoleTrustedPolicy(): Object {

    return {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": [
              "lambda.amazonaws.com",
              "edgelambda.amazonaws.com"
            ]
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }
  }

  private async setRolePolicy(roleName: string): Promise<boolean> {

    return new Promise((resolve, reject) => {

      const params: IAM.PutRolePolicyRequest = {
        PolicyDocument: JSON.stringify(this.getRolePolicy()),
        PolicyName: "S3BlogPolicy",
        RoleName: roleName
      };

      this.iam.putRolePolicy(params, (err: AWSError) => {

        return err ? reject(err) : resolve(true);
      });
    });
  }

  private getRolePolicy(): Object {

    return {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          "Effect": "Allow",
          "Resource": [
            "arn:aws:logs:*:*:*"
          ]
        },
        {
          "Action": [
            "s3:GetObject"
          ],
          "Effect": "Allow",
          "Resource": [
            `arn:aws:s3:::${process.env.SOURCE_BUCKET}/${process.env.SOURCE_FILENAME}`
          ]
        },
        {
          "Action": [
            "s3:*Object"
          ],
          "Effect": "Allow",
          "Resource": [
            `arn:aws:s3:::${process.env.WEBSITE_BUCKET}/*`
          ]
        }
      ]
    };
  }

  private async createLambda(roleArn: string): Promise<Entity> {

    return new Promise(async (resolve, reject) => {

      const params: Lambda.CreateFunctionRequest = {
        FunctionName: this.lambdaName,
        Runtime: 'nodejs8.10',
        Handler: 'lambda.publisher',
        Role: roleArn,
        Code: {
          ZipFile: await this.getFunctionCode()
        },
        Environment: {
          Variables: this.env
        }
      };

      this.lambda.createFunction(params, (err: AWSError, data: Lambda.FunctionConfiguration) => {

        if (err) {
          return reject(err);
        }

        return resolve({
          arn: data.FunctionArn + '',
          name: data.FunctionName + ''
        });
      });
    });
  }

  private async getFunctionCode(): Promise<Buffer> {

    return new Promise((resolve, reject) => {

      fs.readFile('/tmp/lambda.blog-publisher.zip', (err: NodeJS.ErrnoException | null, data: Buffer) => {

        return err ? reject(err) : resolve(data);
      });
    })
  }

  private async setLambdaPermissions(lambda: Entity): Promise<boolean> {

    return new Promise((resolve, reject) => {

      const params: Lambda.AddPermissionRequest = {
        Action: 'lambda:InvokeFunction',
        FunctionName: lambda.name,
        Principal: 's3.amazonaws.com',
        SourceArn: `arn:aws:s3:::${process.env.SOURCE_BUCKET}`,
        StatementId: 'ID-1'
      }

      this.lambda.addPermission(params, (err: AWSError) => err ? reject(err) : resolve(true));
    });
  }

  private async setBucketNotifications(lambda: Entity): Promise<boolean> {

    return new Promise((resolve, reject) => {

      const params: S3.PutBucketNotificationConfigurationRequest = {
        Bucket: process.env.SOURCE_BUCKET + '',
        NotificationConfiguration: this.getBucketNotificationConfiguration(lambda)
      };

      this.s3.putBucketNotificationConfiguration(params, (err: AWSError) => {

        return err ? reject(err.stack) : resolve(true);
      });
    });
  }

  private getBucketNotificationConfiguration(lambda: Entity): Object {

    return {
      "LambdaFunctionConfigurations": [
        {
          "Id": "blog-publisher-lambda",
          "LambdaFunctionArn": lambda.arn,
          "Events": [ "s3:ObjectCreated:*" ],
          "Filter": {
            "Key": {
              "FilterRules": [{ "Name": "suffix", "Value": ".zip" }]
            }
          }
        }
      ]
    };
  }
}
