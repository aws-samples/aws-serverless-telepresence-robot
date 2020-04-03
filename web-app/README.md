# telepresence-robot-interface

## Project setup
1.	Follow the instructions to [install and configure the Amplify CLI](https://aws-amplify.github.io/docs/).
2.	Clone [this project](https://github.com/aws-samples/aws-serverless-telepresence-robot) from GitHub and navigate to the web-app directory.

```bash
git clone https://github.com/aws-samples/aws-serverless-telepresence-robot.git
cd aws-serverless-telepresence-robot/web-app
```

3.	Install the dependencies.

```bash
npm install
```

1.	Initialize Amplify in the project using this command. When asked what type of app you’re building choose **javascript** and set the framework to **vue**. For all other fields accept the defaults.

```bash
amplify init
```

2.	Add authentication using the CLI. When prompted, choose **Amazon Cognito** as the provider and **Username** as the sign in method. Accept defaults for all other options.

```bash
amplify add auth
```

3.	Use Amplify to deploy the backend resources using AWS CloudFormation.

```bash
amplify push
```

## Configure

Create a file src/config.json:

```json
{
  "endpoint": "< The API Gateway endpoint created by the SAM app >",
  "channelARN": "< The ARN of the signalling channel created by the SAM app >"
}
```

### Add hosting and publish

```bash
amplify add hosting
amplify publish
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
