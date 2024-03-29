require('dotenv').config()
const express = require('express')
const bodyparser = require('body-parser')
const prettyjson = require('prettyjson')
const { preAuthrite, postAuthrite } = require('./routes')
const authrite = require('authrite-express')

const spawn = require('child_process').spawn

const {
  NODE_ENV,
  PORT,
  SERVER_PRIVATE_KEY,
  HOSTING_DOMAIN
} = process.env
const HTTP_PORT = NODE_ENV !== 'development'
  ? 3000
  : PORT || process.env.HTTP_PORT || 8080

const ROUTING_PREFIX = process.env.ROUTING_PREFIX || ''
const app = express()
const http = require('http').Server(app)

const io = authrite.socket(http, {
  cors: {
    origin: '*'
  },
  serverPrivateKey: SERVER_PRIVATE_KEY
})

app.use(bodyparser.json({ limit: '1gb', type: 'application/json' }))

// This ensures that HTTPS is used unless you are in development mode
app.use((req, res, next) => {
  if (
    !req.secure &&
    req.get('x-forwarded-proto') !== 'https' &&
    NODE_ENV !== 'development'
  ) {
    return res.redirect('https://' + req.get('host') + req.url)
  }
  next()
})

// This allows the API to be used when CORS is enforced
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Access-Control-Expose-Headers', '*')
  res.header('Access-Control-Allow-Private-Network', 'true')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Configure socket connections
io.on('connection', function (socket) {
  console.log('A user connected')

  // Support private rooms as well
  socket.on('joinPrivateRoom', (roomId) => {
    socket.join(roomId)
    console.log('User joined private room');
  })

  // Joining a room
  socket.on('joinRoom', (roomId) => {
    if (socket.handshake.headers['x-authrite-identity-key'] === roomId.substring(0, roomId.indexOf('-'))) {
      socket.join(roomId)
      console.log(`User joined room ${roomId}`);
    }
  })

  // Leaving a room
  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId)
    console.log(`User left room ${roomId}`);
  })

  // Sending a message to a room
  socket.on('sendMessage', ({ roomId, message }) => {
    if (socket.handshake.headers['x-authrite-identity-key']) {
      let dataToSend = { sender: socket.handshake.headers['x-authrite-identity-key'] }
      // Merge message props with sender if type is object
      if (typeof message === 'object' && Object.keys(message).length !== 0) {
        Object.assign(dataToSend, message)
      } else {
        dataToSend.message = message
      }
      io.to(roomId).emit(`sendMessage-${roomId}`, dataToSend)
    }
  })

  socket.on('disconnect', (reason) => {
    console.log(`Disconnected: ${reason}`)
  })

  socket.on('reconnect', (attemptNumber) => {
    console.log(`Reconnected after ${attemptNumber} attempts`)
  })

  socket.on('reconnect_error', (error) => {
    console.log('Reconnection failed:', error)
  })
})

// logger
app.use((req, res, next) => {
  console.log('[' + req.method + '] <- ' + req._parsedUrl.pathname)
  const logObject = { ...req.body }
  console.log(prettyjson.render(logObject, { keysColor: 'blue' }))
  res.nologJson = res.json
  res.json = json => {
    res.nologJson(json)
    console.log('[' + req.method + '] -> ' + req._parsedUrl.pathname)
    console.log(prettyjson.render(json, { keysColor: 'green' }))
  }
  next()
})

app.use(express.static('public'))

// Unsecured pre-Authrite routes are added first

// Cycle through pre-authrite routes
preAuthrite.forEach((route) => {
  app[route.type](`${ROUTING_PREFIX}${route.path}`, route.func)
})

// Authrite is enforced from here forward
app.use(authrite.middleware({
  serverPrivateKey: SERVER_PRIVATE_KEY,
  baseUrl: HOSTING_DOMAIN
  // This allows you to request certificates from clients
  // requestedCertificates: {}
}))

// Optional: Add PacketPay middleware here to monetize API endpoints

// Post-Authrite routes are added
postAuthrite.forEach((route) => {
  app[route.type](`${ROUTING_PREFIX}${route.path}`, route.func)
})

// route not found error returned
app.use((req, res) => {
  console.log('404', req.url)
  res.status(404).json({
    status: 'error',
    code: 'ERR_ROUTE_NOT_FOUND',
    description: 'Route not found.'
  })
})

// This starts the API server listening for requests
http.listen(HTTP_PORT, () => {
  console.log('PeerServ listening on port', HTTP_PORT)
  if (NODE_ENV !== 'development') {
    spawn('nginx', [], { stdio: [process.stdin, process.stdout, process.stderr] })
  }
})
