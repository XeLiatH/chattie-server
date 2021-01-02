const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const config = require('./config.json');

const app = express();
const server = http.createServer(app);
// todo: CORS should probably not be included in final build?
const io = socketio(server, {
    cors: config.cors
});

// Set static folder to public
app.use(express.static(path.join(__dirname, 'public')));

// some actual code ??
io.on('connection', socket => {
    console.log('Client connected to the f-ing server.');

    socket.on('disconnect', () => {
        console.log('Client disconnected from the f-ing server.');
    });
});

const PORT = 8888 || process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
