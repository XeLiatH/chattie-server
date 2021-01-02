const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const mysql = require('mysql');

const config = require('./config.json');

const app = express();
const server = http.createServer(app);
// todo: CORS should probably not be included in final build?
const io = socketio(server, {
    cors: config.cors
});

// Establish database connection
const connection = mysql.createConnection(config.mysql);
connection.connect();

connection.query('SELECT 1 + 1 AS solution', function (err, rows, fields) {
    if (err) throw err

    console.log('The solution is: ', rows[0].solution)
});

connection.end();

// Set static folder to public
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.get('/users', (req, res) => {
    res.json([
        {
            id: 1,
            email: "matej.beran@tul.cz"
        }
    ]);
});

app.get('/chat/direct', (req, res) => {
    
});

app.post('/chat/direct', (req, res) => {
    
});

app.delete('/chat/direct/:directChatId', (req, res) => {
    // req.params.directChatId
});

app.post('/chat/direct/:directChatId/messeges', (req, res) => {
    
});

app.get('/chat/groups', (req, res) => {
    
});

app.post('/chat/groups', (req, res) => {
    
});

app.put('/chat/groups/:chatGroupId', (req, res) => {
    
});

app.delete('/chat/groups/:chatGroupId', (req, res) => {
    
});

app.get('/chat/groups/:chatGroupId/messeges', (req, res) => {
    
});

// some actual code ??
io.on('connection', socket => {
    console.log('Client connected to the f-ing server.');

    socket.on('disconnect', () => {
        console.log('Client disconnected from the f-ing server.');
    });
});

const PORT = 8888 || process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
