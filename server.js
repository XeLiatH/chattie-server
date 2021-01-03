const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const mysql = require('mysql');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const config = require('./config.json');

const app = express();
const server = http.createServer(app);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token");
    next();
});

// todo: CORS should probably not be included in final build?
const io = socketio(server, {
    cors: config.cors
});

// Establish database connection
const db = mysql.createConnection(config.mysql);

// Set static folder to public
app.use(express.static(path.join(__dirname, 'public')));

// Variable to keep track of connected sockets
let onlineUsers = [];

// JWT middleware
function jwtGuard(req, res, next) {
    const token = req.headers['x-access-token'];
    if (!token) {
        return res.status(401).json({ message: "Where is your token? Hmmmmmmmmmmmmmmmmmmmm? ..." });
    }

    jwt.verify(token, config.jwt.secret, (err, decoded) => {
        if (err) {
            return res.status(500).json({ message: "Token doesn't work. Take care."})
        }

        req.loggedUserId = decoded.id;
        next();
    });
}

// Routes
app.get('/users', jwtGuard, (req, res) => {
    db.query("SELECT id, email, name FROM user", (err, data, fields) => {
        if (err) {
            res.status(500).json({ error: "Unable to fetch the users. Database issue is at play here." })
        }

        data.forEach(u => {
            u.online = -1 !== onlineUsers.findIndex(ou => ou.id === u.id);
        });

        res.status(200).json(data);
    });
});

app.get('/users/logged', jwtGuard, (req, res) => {
    db.query(`SELECT id, email, name FROM user WHERE id = ${req.loggedUserId}`, (err, data, fields) => {
        if (err) {
            res.status(500).json({ error: "Unable to fetch logged user. Database issue is at play here." })
        }

        res.status(200).json(data[0]);
    });
});

app.post('/users/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(403).json({ msg: "You have to enter both email and a password." });
    }

    db.query(`SELECT * FROM user WHERE email = '${email}'`, (err, data, fields) => {
        if (err) {
            return res.status(500).json({ error: "Unable to fetch the users. Database issue is at play here." });
        }

        const user = data[0] || null;
        if (!user) {
            return res.status(400).json({ error:  `Cannot find user ${email}. Typo maybe?` });
        }

        const passwdOk = bcrypt.compareSync(password, user['password']);
        if (!passwdOk) {
            return res.status(400).json({ error:  `Incorrect password. Typo maybe? Are you bruteforcing? (if so please stop)` });
        }

        const token = jwt.sign({ id: user['id'] }, config.jwt.secret, { expiresIn: config.jwt.expiration });

        return res.status(200).json({ token });
    });
});

app.get('/chat/:user2', jwtGuard, (req, res) => {
    const { user2 } = req.params;
    const user1 = req.loggedUserId;

    db.query(`INSERT IGNORE INTO chat_direct(user_id_1, user_id_2, started_at) VALUES (${user1}, ${user2}, CURRENT_TIMESTAMP)`);
    db.query(`SELECT * FROM chat_direct WHERE (user_id_1 = ${user1} AND user_id_2 = ${user2}) OR (user_id_2 = ${user1} AND user_id_1 = ${user2})`, (err, chat_data, fields) => {
        if (err) {
            return res.status(500).json({ error: "Unable to fetch the chat. Database issue is at play here." })
        }

        const chat = chat_data[0] || null;
        if (chat) {

            db.query(`SELECT * FROM chat_direct_msg WHERE chat_direct_id = ${chat.id} ORDER BY sent_at DESC LIMIT 50`, (err, messages, fields) => {
                chat.messages = messages || [];

                res.status(200).json(chat);
            });
        }
    });
});

// Listen for socket connection
io.on('connection', socket => {
    console.log('Client connected to the f-ing server.');

    socket.on('join_chat', room => {
        socket.join(room);
    });

    socket.on('joined', data => {
        onlineUsers.push({ id: data.id, s_id: socket.id });

        db.query("SELECT id, email, name FROM user", (err, d, fields) => {
            if (err) {
               socket.emit('users', []);
            }
    
            d.forEach(u => {
                u.online = -1 !== onlineUsers.findIndex(ou => ou.id === u.id);
            });
    
            socket.broadcast.emit('users', d);
        });
    });

    socket.on('message', data => {
        const { context, text, userId } = data;
        db.query(`INSERT INTO chat_direct_msg(chat_direct_id, user_id, message, sent_at) VALUES (${context.id}, ${userId}, '${text}', CURRENT_TIMESTAMP)`, (err, result) => {
            
            db.query(`SELECT * FROM chat_direct_msg WHERE id = ${result.insertId}`, (err, data) => {
                io.to(context.type + ':' + context.id).emit('message', data[0]);
            });
        });
    });

    socket.on('disconnect', () => {

        onlineUsers = onlineUsers.filter(u => u.s_id !== socket.id);

        db.query("SELECT id, email, name FROM user", (err, d, fields) => {
            if (err) {
               socket.emit('users', []);
            }
    
            d.forEach(u => {
                u.online = -1 !== onlineUsers.findIndex(ou => ou.id === u.id);
            });
    
            socket.broadcast.emit('users', d);
        });

        console.log('Client disconnected from the f-ing server.');
    });
});

const PORT = 8888 || process.env.PORT;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
