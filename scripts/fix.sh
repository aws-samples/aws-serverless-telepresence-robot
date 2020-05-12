#!/bin/bash

rm -rf /home/pi/Projects/amazon-kinesis-video-streams-webrtc-sdk-c
git clone --recursive https://github.com/awslabs/amazon-kinesis-video-streams-webrtc-sdk-c.git
cd /home/pi/Projects/amazon-kinesis-video-streams-webrtc-sdk-c
git checkout 389703f1f46ce71ab0a77bf9a061feb4a44e9636
git submodule update --recursive
cd /home/pi/Projects/amazon-kinesis-video-streams-webrtc-sdk-c/samples
rm /home/pi/Projects/amazon-kinesis-video-streams-webrtc-sdk-c/samples/Common.c
curl --silent 'https://raw.githubusercontent.com/aws-samples/aws-serverless-telepresence-robot/master/scripts/modified-common.c' --output Common.c

cd /home/pi/Projects/amazon-kinesis-video-streams-webrtc-sdk-c
mkdir build
cd build
cmake .. 
make

cp /home/pi/Projects/amazon-kinesis-video-streams-webrtc-sdk-c/build/kvsWebrtcClientMasterGstSample /home/pi/Projects/robot/
