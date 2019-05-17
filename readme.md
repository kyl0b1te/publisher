# publisher

Publisher is a AWS lambda for publish hugo based static website content.
It's kind of "all in the one box solution".
It means that all AWS lambda related work will be done by automatically.

Of course some actions should be done manually for prevent unexpected behavior.
This is what should be done manually before lambda creation:

- create AWS access keys [AWS Access Keys Guide](https://docs.aws.amazon.com/general/latest/gr/managing-aws-access-keys.html)
- create S3 Bucket and setup website access [AWS explains how to do it](https://docs.aws.amazon.com/AmazonS3/latest/dev/EnableWebsiteHosting.html)
- create S3 bucket for website source files (publisher will store source files in separate bucket for easy re-deploy reasons)
- clone repository

After "git cloning" repository ENV parameters should be set.
Create a file `.env` based on a template (`.env.example`) file and set valid parameter values.

## Deployment

Docker can be used for easy going deploys.
Execute following command to create an image and build lambda `zip` bundle:

`docker build -t publisher .`

This command will run linter, execute tests, compile typescript files and prepare AWS lambda bundle archive.
After that, lambda function can be created.
For achieve that, execute the following command:

`docker run --rm -it publisher bash -c "npm run lambda:create"`

On this stage in your AWS accounts publisher will create:

- [IAM Role](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html) for new publisher lambda will all necessary permissions,
- Lambda [layer](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html) with binaries required for static content generation flow
- AWS Lambda itself.

## Contribution

All kind of contributions are welcome.
