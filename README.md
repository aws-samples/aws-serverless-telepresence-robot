# telepresence-robot

![Architectural Diagram](https://raw.githubusercontent.com/aws-samples/aws-serverless-telepresence-robot/master/diagram.png)

This project contains all the files neccesary to deploy a serverless telepresence robot application using the Pimoroni STS-Pi kit. It will provision all the resources required for permisions and credentials, a kinesis video stream, and also deploy a REST api for driving a robot. A Python script is also included for driving the robot.

The full instructions are published as a two part blog.
https://aws.amazon.com/blogs/compute/building-a-raspberry-pi-telepresence-robot-using-serverless-part-1/
https://aws.amazon.com/blogs/compute/building-a-raspberry-pi-telepresence-robot-using-serverless-part-2/

```bash
.
├── README.MD                  <-- This instructions file
├── src
│  └── SendAction              <-- Source code for a lambda function
│       └── app.js             <-- Publish messages on an IoT topic
│  └── customresources
│       └── credentialsEndpoint.js  <-- Lambda handler for IoT Credentials endpoint custom resource
│       └── kinesisVideoStream.js   <-- Lambda handler for Kinesis Video Signaling Channel custom resource
│       └── roleAlias.js            <-- Lambda handler for Role Alias custom resource
├── scripts
│  └── main.py                     <-- Script for driving the robot via AWS IoT messages
│  └── install.sh                   <-- Easy install script for the raspberry pi
│  └── modified-common.c            <-- A modification for the kinesis video sample app in order to allow it to use IoT credentials.
├── template.yaml                   <-- SAM template
```


## Deploy the sample application

The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

To use the SAM CLI, you need the following tools.

* SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* Node.js - [Install Node.js 10](https://nodejs.org/en/), including the NPM package management tool.
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)

To build and deploy your application for the first time, run the following in your shell:

```bash
sam build
sam deploy --guided
```

The first command will build the source of your application. The second command will package and deploy your application to AWS, with a series of prompts:


==============================================

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
