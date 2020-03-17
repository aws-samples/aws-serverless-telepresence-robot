# telepresence-robot-interface

## Project setup
```
npm install
amplify init
amplify add auth
amplify push
amplify add hosting
amplify publish
```

## Configure

Create a file src/config.json:

```json
{
  "endpoint": "< The API Gateway endpoint created by the SAM app >",
  "channelARN": "< The ARN of the signalling channel created by the SAM app >"
}
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
