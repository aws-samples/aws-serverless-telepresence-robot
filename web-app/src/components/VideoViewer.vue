<template>
  <div class="viewer">
    <h1>{{ msg }}</h1>
    <div id="video-container">
      <div id="video-controls">
        <button type="button" id="open-stream" v-on:click="openStream" v-if="!isStreamActive">Open Video</button>
        <button type="button" id="stop-stream" v-on:click="stopStream" v-if="isStreamActive">Stop Video</button>
        <button type="button" id="rotate" v-on:click="rotateVideo" v-if="isStreamActive">Rotate</button>
      </div>
      <video class="remote-view" id="myVideoEl" v-bind:hidden="!isStreamActive" autoplay playsinline  />
    </div>
  </div>
</template>

<script>

import { SignalingClient } from 'amazon-kinesis-video-streams-webrtc'
import { Auth } from 'aws-amplify'
import { v4 as uuid } from 'uuid'
import AWS from 'aws-sdk'
import * as config from '../config.json'

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
  console.log('Starting Viewer')
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

  viewer.peerConnection = new RTCPeerConnection({ iceServers })

  viewer.signalingClient = new SignalingClient({
      channelARN,
      channelEndpoint: endpointsByProtocol.WSS,
      clientId,
      role: 'VIEWER',
      region,
      credentials
  })

  viewer.signalingClient.on('open', async () => {
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
      console.log('[VIEWER] Signaling client anser: ', answer)
  })

  // When an ICE candidate is received from the master, add it to the peer connection.
  viewer.signalingClient.on('iceCandidate', candidate => {
      console.log('[VIEWER] Signaling client candidate received: ', candidate)
      viewer.peerConnection.addIceCandidate(candidate)
  })

  viewer.signalingClient.on('close', () => {
      console.log('[VIEWER] Signaling client closed')
      stopViewer()
  })

  viewer.signalingClient.on('error', error => {
      console.log(error)
  })

  viewer.peerConnection.addEventListener('icecandidate', ({ candidate }) => {
      if (candidate) {
        viewer.signalingClient.sendIceCandidate(candidate)
      }
  })

  // As remote tracks are received, add them to the remote view
  viewer.remoteView = document.querySelector('#myVideoEl')
  viewer.remoteView.play()
  viewer.peerConnection.addEventListener('track', event => {
      if (viewer.remoteView.srcObject) {
          return
      }
      viewer.remoteView.srcObject = event.streams[0]
  })

  viewer.signalingClient.open()

}

function stopViewer() {
    console.log('[VIEWER] Stopping viewer connection');
    if (viewer.signalingClient) {
        viewer.signalingClient.close();
        viewer.signalingClient = null;
    }

    if (viewer.peerConnection) {
        viewer.peerConnection.close();
        viewer.peerConnection = null;
    }

    if (viewer.remoteView) {
        viewer.remoteView.srcObject = null;
    }
}


export default {
  name: 'WebRTC',
  props: {
    msg: String
  },
  data() {
    return {
      isStreamActive: false
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
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
video {
  width:50%;
  visibility: visible;
  background: transparent url('../assets/poster.png') 50% 50% / contain ;
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
