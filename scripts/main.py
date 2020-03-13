# Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# Permission is hereby granted, free of charge, to any person obtaining a copy of this
# software and associated documentation files (the "Software"), to deal in the Software
# without restriction, including without limitation the rights to use, copy, modify,
# merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so.
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
# PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
# HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
# OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
import explorerhat
import subprocess
import signal
import json
import time
import sys
import os

speed = 50

with open('./config.json') as json_file:
    config = json.load(json_file)

host = config['IOT_CORE_ENDPOINT']
clientId = config['IOT_THINGNAME']
topic = clientId + '/action'

rootCAPath = './cacert.pem'
certificatePath = './certificate.pem'
privateKeyPath = './private.pem.key'
port = 443
useWebsocket = False

def runKinesisVideoStream():
    environmentVars  = 'IOT_GET_CREDENTIAL_ENDPOINT=' + config['IOT_GET_CREDENTIAL_ENDPOINT']
    environmentVars += ' ROLE_ALIAS=' + config['ROLE_ALIAS']
    environmentVars += ' AWS_DEFAULT_REGION=' + config['AWS_DEFAULT_REGION']

    command = environmentVars + ' ./kvsWebrtcClientMasterGstSample ' + clientId + ' /'
    proc = subprocess.Popen(command, stdout=subprocess.PIPE, shell=True)

# Handle incoming messages and take action
def handleMessage(message):
    print("Received a new message: ")
    print(message.payload)
    print("from topic: ")
    print(message.topic)
    print("--------------\n\n")
    if message.topic == topic:
        payload = json.loads(message.payload)
        if payload['action'] == 'forward':
            explorerhat.motor.forwards(speed)
        if payload['action'] == 'backwards':
            explorerhat.motor.backwards(speed)
        if payload['action'] == 'left':
            explorerhat.motor.one.backwards(speed)
            explorerhat.motor.two.forwards(speed)
        if payload['action'] == 'right':
            explorerhat.motor.one.forwards(speed)
            explorerhat.motor.two.backwards(speed)
        if payload['action'] == 'stop':
            explorerhat.motor.stop()

        time.sleep(0.2)
        explorerhat.motor.stop()

# Init AWSIoTMQTTClient
awsClient = AWSIoTMQTTClient(clientId)
awsClient.configureEndpoint(host, port)
awsClient.configureCredentials(rootCAPath, privateKeyPath, certificatePath)

# AWSIoTMQTTClient connection configuration
awsClient.configureAutoReconnectBackoffTime(1, 32, 20)
awsClient.configureOfflinePublishQueueing(-1)  # Infinite offline Publish queueing
awsClient.configureDrainingFrequency(2)  # Draining: 2 Hz
awsClient.configureConnectDisconnectTimeout(10)  # 10 sec
awsClient.configureMQTTOperationTimeout(5)  # 5 sec
awsClient.onMessage = handleMessage

# Connect and subscribe to AWS IoT
awsClient.connect()
# Note that we are not putting a message callback here. We are using the general message notification callback.
awsClient.subscribeAsync(topic, 1)
time.sleep(2)

# Start the Kinesis Video Gstreamer Sample App using IoT Credentials
runKinesisVideoStream()
time.sleep(1)

while True:
    time.sleep(0.2)
