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
const db = mysql.createConnection(config.mysql);

// Set static folder to public
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.get('/users', (req, res) => {
    db.query("SELECT * FROM user", (err, data, fields) => {
        if (err) {
            res.status(500).json({ error: "Unable to fetch the users. Database issue is at play here." })
        }

        res.status(200).json(data);
    });
});

app.post('/users/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(403).json({ msg: "You have to enter both email and a password." });
    }

    res.status(201).send();
});

app.get('/chat/direct', (req, res) => {
    db.query("SELECT * FROM chat_direct", (err, data, fields) => {
        if (err) {
            res.status(500).json({ error: "Unable to fetch the users. Database issue is at play here." })
        }

        // run the data through foreach and add messages

        res.status(200).json(data);
    });
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

// Listen for socket connection
io.on('connection', socket => {
    console.log('Client connected to the f-ing server.');

    socket.on('disconnect', () => {
        console.log('Client disconnected from the f-ing server.');
    });
});

const PORT = 8888 || process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
