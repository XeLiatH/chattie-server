const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder to public
app.use(express.static(path.join(__dirname, 'public')));

// some actual code ??
io.on('connection', socket => {
    console.log('Client connected to the f-ing server.');
});

const PORT = 8888 || process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
