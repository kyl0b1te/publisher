# blog-publisher

Compile typescript files and prepare lambda function bundle:

`docker build -t publisher .`

Create lambda function:

`docker run --rm -it publisher bash -c "npm run lambda:create"`
