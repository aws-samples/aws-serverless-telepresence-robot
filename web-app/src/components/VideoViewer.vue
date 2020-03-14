<template>
  <div class="viewer">
    <h1>{{ msg }}</h1>
    <div id="video-container">
      <div id="video-controls">
        <button type="button" id="open-stream" v-on:click="openStream" v-if="!isStreamActive">Open Video</button>
        <div id="active-video-controls" v-if="isStreamActive">
          <button type="button" id="stop-stream" v-on:click="stopStream">Stop Video</button>
          <button type="button" id="rotate" v-on:click="rotateVideo">Rotate</button>
          <button type="button" id="full-screen" v-on:click="fullscreen">Full Screen</button>
        </div>
        <input type="checkbox" id="logChoice" v-model="showLogs">
        <label for="logChoice">Logs</label>
      </div>
      <video class="remote-view" id="myVideoEl" v-bind:hidden="!isStreamActive" autoplay playsinline  />
      <div id="logs" v-show="showLogs" />
    </div>

  </div>
</template>

<script>

import { SignalingClient } from 'amazon-kinesis-video-streams-webrtc'
import { Auth } from 'aws-amplify'
import { v4 as uuid } from 'uuid'
import AWS from 'aws-sdk'
import * as config from '../config.json'


function logger(msg) {
  console.log(msg)
  document.getElementById('logs').innerHTML += msg + '<br />'
}

function openStreamViewer() {
  Auth.currentCredentials().then((info) => {
       startViewer({
         channelARN: config.channelARN,
         credentials: Auth.essentialCredentials(info),
         region: info.sts.config.region,
         clientId: uuid()
       })
     })
}

let viewer = {}

async function startViewer(config) {
  logger('Starting Viewer')
  let { credentials, channelARN, region, clientId } = config

  const kinesisVideoClient = new AWS.KinesisVideo({
      region,
      credentials
  });

  const getSignalingChannelEndpointResponse = await kinesisVideoClient
      .getSignalingChannelEndpoint({
          ChannelARN: channelARN,
          SingleMasterChannelEndpointConfiguration: {
              Protocols: ['WSS', 'HTTPS'],
              Role: 'VIEWER'
          }
      })
      .promise()

  const endpointsByProtocol = getSignalingChannelEndpointResponse.ResourceEndpointList.reduce((endpoints, endpoint) => {
      logger('Get siganling channel endpoint')
      endpoints[endpoint.Protocol] = endpoint.ResourceEndpoint
      return endpoints
  }, {})

  const kinesisVideoSignalingChannelsClient = new AWS.KinesisVideoSignalingChannels({
      region,
      credentials,
      endpoint: endpointsByProtocol.HTTPS
  })


  const getIceServerConfigResponse = await kinesisVideoSignalingChannelsClient
      .getIceServerConfig({
          ChannelARN: channelARN
      })
      .promise()

  const iceServers = [
      { urls: `stun:stun.kinesisvideo.${region}.amazonaws.com:443` }
  ]

  getIceServerConfigResponse.IceServerList.forEach(iceServer =>
      iceServers.push({
          urls: iceServer.Uris,
          username: iceServer.Username,
          credential: iceServer.Password
      })
  )

  const platform = navigator.platform
  logger(`Platform: ${platform}`)

  if(platform == 'iPhone') {
    try {
        viewer.localStream = await navigator.mediaDevices.getUserMedia(
          {
            video: true,
            audio: true
          })
    } catch (e) {
        logger(`Could not get usermedia ${JSON.stringify(e)}`);
        return
    }
  }

  viewer.peerConnection = new RTCPeerConnection({ iceServers })
  logger('Create peerConnection')

  viewer.signalingClient = new SignalingClient({
      channelARN,
      channelEndpoint: endpointsByProtocol.WSS,
      clientId,
      role: 'VIEWER',
      region,
      credentials
  })

  viewer.signalingClient.on('open', async () => {
      logger('Creating SDP offer')
      // Create an SDP offer and send it to the master
      const offer = await viewer.peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
      })
      await viewer.peerConnection.setLocalDescription(offer)
      viewer.signalingClient.sendSdpOffer(viewer.peerConnection.localDescription)
  })
  // When the SDP answer is received back from the master, add it to the peer connection.
  viewer.signalingClient.on('sdpAnswer', async answer => {
      await viewer.peerConnection.setRemoteDescription(answer)
      logger('Received sdpAnswer')
  })

  // When an ICE candidate is received from the master, add it to the peer connection.
  viewer.signalingClient.on('iceCandidate', candidate => {
      logger('Candidate received from Master')
      viewer.peerConnection.addIceCandidate(candidate)
  })

  viewer.signalingClient.on('close', () => {
      logger('Signaling Client Closed')
      stopViewer()
  })

  viewer.signalingClient.on('error', error => {
      logger(`ERROR: ${JSON.stringify(error)}`)
  })

  viewer.peerConnection.addEventListener('icecandidate', ({ candidate }) => {
      if (candidate) {
        logger('Received iceCandidate')
        viewer.signalingClient.sendIceCandidate(candidate)
      }
  })

  // As remote tracks are received, add them to the remote view
  viewer.remoteView = document.querySelector('#myVideoEl')
  viewer.remoteView.play()
  logger('Start playing incoming video')

  viewer.peerConnection.addEventListener('track', event => {
      if (viewer.remoteView.srcObject) {
          return
      }
      viewer.remoteView.srcObject = event.streams[0]
  })

  viewer.signalingClient.open()

}

function stopViewer() {
  logger('[VIEWER] Stopping viewer connection')
  if (viewer.signalingClient) {
      viewer.signalingClient.close()
      viewer.signalingClient = null
  }

  if (viewer.peerConnection) {
      viewer.peerConnection.close()
      viewer.peerConnection = null
  }

  if (viewer.remoteView) {
      viewer.remoteView.srcObject = null
  }

  if (viewer.localStream) {
    viewer.localStream = null
  }
}


export default {
  name: 'WebRTC',
  props: {
    msg: String
  },
  data() {
    return {
      isStreamActive: false,
      showLogs: false
    }
  },
  methods: {
    rotateVideo: function () {
      const viewer = document.querySelector('#myVideoEl')
      if(viewer.style.transform == 'rotate(180deg)'){
        viewer.style.transform = 'rotate(0deg)'
      } else {
        viewer.style.transform = 'rotate(180deg)'
      }
    },
    openStream: function () {
      openStreamViewer()
      this.isStreamActive = true
    },
    stopStream: function () {
      stopViewer()
      this.isStreamActive = false
    },
    fullscreen: function () {
      const video = document.querySelector('#myVideoEl')
      if(video.requestFullScreen){
        video.requestFullScreen();
      } else if(video.webkitRequestFullScreen){
        video.webkitRequestFullScreen();
      } else if(video.mozRequestFullScreen){
        video.mozRequestFullScreen();
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
#logs {
  max-height: 100px;
  min-height: 50px;
  max-width: 370px;
  overflow: auto;
  border-style: solid;
  border-width: thin;
  margin: auto;
}
video {
  width:50%;
  visibility: visible;
  background: black;
}
button {
  min-width: 80px;
  display: inline-block;
  margin: 5px;
  vertical-align: middle;
  touch-action: manipulation;
  cursor: pointer;
  user-select: none;
  color: #fff;
  background-color: #f90;
  border-color: #ccc;
  padding: 14px 0;
  border: none;
  border-radius: 2px;
}
button:active {
  opacity: 1;
  background-color: var(--button-click);
}
button:hover {
  opacity: 0.8;
}
button:disabled {
 opacity: 0.6;
 cursor: not-allowed;
}

</style>
