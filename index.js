const http = require('http')
const express = require('express')
const socketio = require('socket.io')

const app = express();
const server = http.Server(app);
const io = socketio(server);

const title = 'Buffer Buzzer'

let data = {
  users: new Set(),
  buzzes: new Set(),
}

const getData = () => ({
  users: [...data.users],
  buzzes: [...data.buzzes].map(b => {
    const [ name, team ] = b.split('-')
    return { name, team }
  })
})

app.use(express.static('public'))
app.set('view engine', 'pug')

app.get('/', (req, res) => res.render('index', { title }))
app.get('/host', (req, res) => res.render('host', Object.assign({ title }, getData())))

io.on('connection', (socket) => {
  socket.on('join', (user) => {
    data.users.add(user.id)
    io.emit('active', [...data.users].length)
    console.log(`${user.name} joined!`)
  })

  socket.on('buzz', (user) => {
    data.buzzes.add(`${user.name}-${user.team}`)
    io.emit('buzzes', [...data.buzzes])
    console.log(`${user.name} buzzed in!`)
    if(data.buzzes.size === 1){
      var it = data.buzzes.values();
      //get first entry:
      var first = it.next();
      //get value out of the iterator entry:
      const firstBuzz = first.value;
      const p = firstBuzz.split('-')

      io.emit('buzzed', `First pressed button : ${p[0]}`)
    }
  })

  socket.on('clear', () => {
    data.buzzes = new Set()
    io.emit('buzzes', [...data.buzzes])
    console.log(`Clear buzzes`)
    io.emit('clearBtn')
  })
})

server.listen(8090, () => console.log('Listening on 8090'))
