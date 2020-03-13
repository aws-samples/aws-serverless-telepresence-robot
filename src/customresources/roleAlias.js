/*
  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
  Permission is hereby granted, free of charge, to any person obtaining a copy of this
  software and associated documentation files (the "Software"), to deal in the Software
  without restriction, including without limitation the rights to use, copy, modify,
  merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
  PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

const AWS = require("aws-sdk");

exports.handler = function(event, context) {
  try {
    console.log("REQUEST RECEIVED:\n" + JSON.stringify(event))

    if (event.RequestType == "Delete") {
      sendResponse(event, context, "SUCCESS")
      return
    }

    //verify params
    const roleAlias = event.ResourceProperties.RoleAlias
    const roleArn = event.ResourceProperties.RoleArn
    const credentialDurationSeconds = 3600 //max
    if (!roleAlias || !roleArn) {
      throw new Error("RoleAlias and RoleArn parameters are required.")
    }

    const iot = new AWS.Iot()

    //check for existing roleAlias
    iot.describeRoleAlias({roleAlias}).promise()
    .then(result => {
      console.log(`The roleAlias ${roleAlias} already exists.`)
      const existingRoleAlias = result.roleAliasDescription
      if (existingRoleAlias.roleArn == roleArn) {
        console.log("No change to the roleAlias roleArn.")
        const responseData = {roleAlias, roleAliasArn: existingRoleAlias.roleAliasArn}
        sendResponse(event, context, "SUCCESS", responseData)
      } else {
        //Alias changed to a different role arn.
        console.log(`updating roleAlias roleArn from ${existingRoleAlias.roleArn} to ${roleArn}.`)
        iot.updateRoleAlias({roleAlias, roleArn, credentialDurationSeconds}).promise()
          .then(responseData => {
            console.log("updated roleAlias.")
            console.log(responseData)
            sendResponse(event, context, "SUCCESS", responseData)
          })
          .catch(err => sendFailed(event, context, err, "Error updating existing role alias."))
      }
    })
    .catch(err => {
      //describeRoleAlias fails if the role-alias does not exist.
      console.log(err)

      console.log(`creating new roleAlias ${roleAlias}.`)
      iot.createRoleAlias({roleAlias, roleArn, credentialDurationSeconds}).promise()
        .then(responseData => {
          console.log("created new roleAlias.")
          console.log(responseData)
          sendResponse(event, context, "SUCCESS", responseData)
        })
        .catch(err => sendFailed(event, context, err, "Error creating new role alias."))
    })
  } catch (err) {
    sendFailed(event, context, err, "Error executing roleAlias custom resource.")
  }
}

function sendFailed(event, context, err, message) {
  if (message != null) {
    console.log(message)
  }
  console.log(err)
  const responseData = {message, errorMessage: err.message, errorStack: err.stack}
  sendResponse(event, context, "FAILED", responseData)
}

// Send response to the pre-signed S3 URL
function sendResponse(event, context, responseStatus, responseData) {

  var responseBody = JSON.stringify({
    Status: responseStatus,
    Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData
  });

  console.log("RESPONSE BODY:\n", responseBody);

  var https = require("https");
  var url = require("url");

  var parsedUrl = url.parse(event.ResponseURL);
  var options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: "PUT",
    headers: {
      "content-type": "",
      "content-length": responseBody.length
    }
  };

  console.log("SENDING RESPONSE...\n");

  var request = https.request(options, function(response) {
    console.log("STATUS: " + response.statusCode);
    console.log("HEADERS: " + JSON.stringify(response.headers));
    // Tell AWS Lambda that the function execution is done
    context.done();
  });

  request.on("error", function(error) {
    console.log("sendResponse Error:" + error);
    // Tell AWS Lambda that the function execution is done
    context.done();
  });

  // write data to request body
  request.write(responseBody);
  request.end();
}
