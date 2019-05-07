import { Lambda, AWSError, IAM, S3 } from 'aws-sdk';

import { Command } from './command';

interface Entity {
  arn: string,
  name: string
}

export class CreateCommand extends Command {

  private iam: IAM;
  private s3: S3;

  constructor() {
    super();
    this.iam = new IAM();
    this.s3 = new S3();
  }

  async run(): Promise<any> {

    const role = await this.createRole();
    await this.setRolePolicy(role.name);

    const layer = await this.createLayer(role);
    const lambda = await this.createLambda(role, [layer]);
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
            "s3:*"
          ],
          "Effect": "Allow",
          "Resource": [
            `arn:aws:s3:::${process.env.WEBSITE_BUCKET}`,
            `arn:aws:s3:::${process.env.WEBSITE_BUCKET}/*`
          ]
        }
      ]
    };
  }

  private async createLayer(role: Entity): Promise<Entity> {

    return new Promise(async (resolve, reject) => {

      const request: Lambda.PublishLayerVersionRequest = {
        Content: {
          ZipFile: await this.getDependencies()
        },
        LayerName: this.getLayerName(role),
        Description: 'Helper binaries for generate static content and sync files with S3 bucket'
      };
      return this.lambda.publishLayerVersion(request, (err: AWSError, data: Lambda.PublishLayerVersionResponse) => {

        if (err) {
          return reject(err);
        }

        return resolve({ arn: data.LayerArn + '', name: request.LayerName });
      });
    });
  }

  private async createLambda(role: Entity, layers: Entity[]): Promise<Entity> {

    return new Promise(async (resolve, reject) => {

      const params: Lambda.CreateFunctionRequest = {
        FunctionName: this.lambdaName,
        Runtime: 'nodejs8.10',
        Handler: 'lambda.publisher',
        Role: role.arn,
        Timeout: 30,
        MemorySize: 128,
        Code: {
          ZipFile: await this.getFunctionCode()
        },
        Layers: layers.map((layer: Entity) => layer.arn)
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

  private getLayerName(role: Entity) {

    const client = this.getClientByRole(role);
    const { WEBSITE_REGION, HUGO_VERSION, BSYNC_VERSION } = process.env;

    return [
      'arn:aws:lambda',
      WEBSITE_REGION,
      client,
      'layer',
      `hugo-${HUGO_VERSION}-bsync-${BSYNC_VERSION}`.replace(/\./g, '')
    ].join(':');
  }

  private getClientByRole(role: Entity): string {

    return role.arn.replace('arn:aws:iam::', '').split(':')[0];
  }
}
