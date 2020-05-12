#!/bin/bash

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

sudo apt-get update
sudo apt-get -y upgrade

sudo apt-get -y install curl
sudo apt-get -y install python3
sudo apt-get -y install python3-pip
sudo apt-get -y install git g++ gcc cmake make
sudo apt-get -y install libssl-dev libcurl4-openssl-dev liblog4cplus-1.1-9 liblog4cplus-dev
sudo apt-get -y install libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev
sudo apt-get -y install gstreamer1.0-plugins-base-apps gstreamer1.0-plugins-bad
sudo apt-get -y install gstreamer1.0-plugins-good gstreamer1.0-plugins-ugly gstreamer1.0-tools
sudo apt-get -y install gstreamer1.0-omx
pip3 install AWSIoTPythonSDK

if [ "$MOTOR_DRIVER" == "adafruit" ]
then
    sudo pip3 install adafruit-circuitpython-motorkit
else
    sudo apt-get -y install python3-explorerhat
fi

if [ ! -d /home/pi/Projects ]
then
  mkdir /home/pi/Projects
  cd /home/pi/Projects
else
  cd /home/pi/Projects
fi

if [ ! -d /home/pi/Projects/robot ]
then
  mkdir /home/pi/Projects/robot
  cd /home/pi/Projects/robot
else
  cd /home/pi/Projects/robot
fi

if [ "$MOTOR_DRIVER" == "adafruit" ]
then
    curl --silent 'https://raw.githubusercontent.com/aws-samples/aws-serverless-telepresence-robot/master/scripts/adafruit-motor-hat-main.py' --output main.py
else
    curl --silent 'https://raw.githubusercontent.com/aws-samples/aws-serverless-telepresence-robot/master/scripts/main.py' --output main.py
fi

cat > config.json <<EOF
{
  "IOT_THINGNAME": "",
  "IOT_CORE_ENDPOINT": "",
  "IOT_GET_CREDENTIAL_ENDPOINT": "",
  "ROLE_ALIAS": "robot-camera-streaming-role-alias",
  "AWS_DEFAULT_REGION": ""
}
EOF

mkdir /home/pi/Projects/robot/certs
cd /home/pi/Projects/robot/certs
curl --silent 'https://www.amazontrust.com/repository/SFSRootCAG2.pem' --output cacert.pem
touch certificate.pem
touch private.pem.key

cd /home/pi/Projects

if [ "$USE_PREBUILT" == True ]
then
  cd /home/pi/Projects/robot/
  wget 'https://raw.githubusercontent.com/aws-samples/aws-serverless-telepresence-robot/master/scripts/webrtc_build/kvsWebrtcClientMasterGstSample'
  wget 'https://raw.githubusercontent.com/aws-samples/aws-serverless-telepresence-robot/master/scripts/webrtc_build/libkvsWebrtcClient.so'
  wget 'https://raw.githubusercontent.com/aws-samples/aws-serverless-telepresence-robot/master/scripts/webrtc_build/libkvsWebrtcSignalingClient.so'
  sudo chmod +x kvsWebrtcClientMasterGstSample
else
  if [ ! -d /home/pi/Projects/amazon-kinesis-video-streams-webrtc-sdk-c ]
  then
    git clone --recursive https://github.com/awslabs/amazon-kinesis-video-streams-webrtc-sdk-c.git
    cd /home/pi/Projects/amazon-kinesis-video-streams-webrtc-sdk-c
  else
    cd /home/pi/Projects/amazon-kinesis-video-streams-webrtc-sdk-c
    git pull
  fi

  git checkout 389703f1f46ce71ab0a77bf9a061feb4a44e9636
  git submodule update --recursive
  cd /home/pi/Projects/amazon-kinesis-video-streams-webrtc-sdk-c/samples
  rm /home/pi/Projects/amazon-kinesis-video-streams-webrtc-sdk-c/samples/Common.c
  curl --silent 'https://raw.githubusercontent.com/aws-samples/aws-serverless-telepresence-robot/master/scripts/modified-common.c' --output Common.c

  cd /home/pi/Projects/amazon-kinesis-video-streams-webrtc-sdk-c
  mkdir build
  cd build
  cmake -DBUILD_STATIC_LIBS=TRUE ..
  make

  cp /home/pi/Projects/amazon-kinesis-video-streams-webrtc-sdk-c/build/kvsWebrtcClientMasterGstSample /home/pi/Projects/robot/
fi
