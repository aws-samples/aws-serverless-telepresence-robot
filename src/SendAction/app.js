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

var AWS = require('aws-sdk');
var iot = new AWS.Iot();
var robotName = process.env.ROBOT_NAME;
var publishTopic = `${robotName}/action`

exports.handler = (event, context, callback) => {
  console.log("message received:", JSON.stringify(event.body, null, 2))

  var params = {
       topic: publishTopic,
       payload: event.body,
       qos: 0
  }

  publishMessage(params, (err, res) => {
    callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
            "Access-Control-Allow-Origin": "*"
        }
    })
  })
}

const publishMessage = (params, callback) => {
  iot.describeEndpoint({}, (err, data) => {
    if(err){
      console.log(err)
      callback(err)
    }else{
      var iotdata = new AWS.IotData({endpoint: data.endpointAddress});
      iotdata.publish(params, (err, data) => {
        if(err){
          console.log(err)
          callback(err)
        }else{
          console.log("success?")
          callback(null, params)
        }
      })
    }
  })
}
