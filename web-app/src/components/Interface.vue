<template>
  <div class="hello">
    <button v-on:click="forward">
      <i class="arrow up" />
    </button>
    <div class="btn-group">
      <button v-on:click="left">
        <i class="arrow left" />
      </button>
      <button v-on:click="backwards">
        <i class="arrow down" />
      </button>
      <button v-on:click="right">
        <i class="arrow right" />
      </button>
    </div>
  </div>
</template>

<script>
import { Auth, API } from 'aws-amplify'

Auth.currentCredentials().then((info) => {
     console.log(info)
   });


async function postData(dir) {
   let apiName = 'SendAction';
   let path = '/publish';
   let myInit = {
     body: {
       action: dir
     }
   }
   return await API.post(apiName, path, myInit);
}


export default {
  name: 'Interface',
  methods: {
    forward: function () {
      postData('forward')
    },
    backwards: function () {
      postData('backwards')
    },
    left: function () {
      postData('left')
    },
    right: function () {
      postData('right')
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
i {
  border: solid white;
  border-width: 0 3px 3px 0;
  display: inline-block;
  padding: 3px;
}

.right {
  transform: rotate(-45deg);
  -webkit-transform: rotate(-45deg);
}

.left {
  transform: rotate(135deg);
  -webkit-transform: rotate(135deg);
}

.up {
  transform: rotate(-135deg);
  -webkit-transform: rotate(-135deg);
}

.down {
  transform: rotate(45deg);
  -webkit-transform: rotate(45deg);
}
button {
  min-width: 45px;
  display: inline-block;
  margin-bottom: 0;
  margin: 3px;
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
</style>
