var express = require('express')
var jwt = require('jsonwebtoken')
var cors = require('cors')
var bodyParser = require('body-parser')
var fs = require('fs')
var events = require('./db/events.json')

const app = express()

app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API.'
  })
})

app.get('/dashboard', verifyToken, (req, res) => {
  jwt.verify(req.token, 'the_secret_key', err => {
    if (err) {
      res.sendStatus(401)
    } else {
      res.json({
        events: events
      })
    }
  })
})

app.post('/register', (req, res) => {
  if (req.body) {
    const user = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    }

    var data = JSON.stringify(user, null, 2)
    var dbUserEmail = require('./db/user.json').email

    if (dbUserEmail === req.body.email) {
      res.sendStatus(409)
    } else {
      fs.writeFile('./db/user.json', data, err => {
        if (err) {
          console.log(err + data)
        } else {
          const token = jwt.sign({ user }, 'the_secret_key')
          res.json({
            token,
            email: user.email,
            name: user.name
          })
          console.log(`Added ${data} to user.json`)
        }
      })
    }
  } else {
    res.sendStatus(401)
  }
})

app.post('/login', (req, res) => {
  var userDB = fs.readFileSync('./db/user.json')
  var userInfo = JSON.parse(userDB)
  if (
    req.body &&
    req.body.email === userInfo.email &&
    req.body.password === userInfo.password
  ) {
    const token = jwt.sign({ userInfo }, 'the_secret_key')
    res.json({
      token,
      email: userInfo.email,
      name: userInfo.name
    })
  } else {
    res.sendStatus(401)
  }
})

//MIDDLEWARE
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization']

  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ')
    const bearerToken = bearer[1]
    req.token = bearerToken
    next()
  } else {
    res.sendStatus(401)
  }
}

app.listen(3000, () => {
  console.log('Server started on port 3000')
})
