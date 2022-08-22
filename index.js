const express = require('express');

const app = express()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/class/create', (req, res) => {
      res.send('Hello World!')
})

app.get('/class/:id', (req, res) => {
  res.send('Hello World!')
})

app.get('/class/:id/dashboard', (req, res) => {
  res.send('Hello World!')
})

app.get('/class/:id/admin', (req, res) => {
  res.send('Hello World!')
})

app.listen(3000, () => {
  console.log('Listening on port 3000')
})