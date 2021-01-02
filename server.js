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

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// todo: CORS should probably not be included in final build?
const io = socketio(server, {
    cors: config.cors
});

// Establish database connection
const db = mysql.createConnection(config.mysql);

// Set static folder to public
app.use(express.static(path.join(__dirname, 'public')));

function jwtGuard(req, res, next) {
    const token = req.headers['x-access-token'];
    if (!token) {
        return res.status(401).json({ message: "Where is your token? Hmmmmmmmmmmmmmmmmmmmm? ..." });
    }

    jwt.verify(token, config.jwt.secret, (err, decoded) => {
        if (err) {
            res.status(500).json({ message: "Token doesn't work. Take care."})
        }

        req.loggedUserId = decoded.id;
        next();
    });
}

// routes
app.get('/users', jwtGuard, (req, res) => {
    db.query("SELECT id, email, name FROM user", (err, data, fields) => {
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

    db.query(`SELECT * FROM user WHERE email = '${email}'`, (err, data, fields) => {
        if (err) {
            res.status(500).json({ error: "Unable to fetch the users. Database issue is at play here." });
        }

        const user = data[0] || null;
        if (!user) {
            res.status(400).json({ error:  `Cannot find user ${email}. Typo maybe?` });
        }
    
        const passwdOk = bcrypt.compareSync(password, user['password']);
        if (!password) {
            res.status(400).json({ error:  `Incorrect password. Typo maybe? Are you bruteforcing? (if so please stop)` });
        }

        const token = jwt.sign({ id: user['id'] }, config.jwt.secret, { expiresIn: config.jwt.expiration });

        res.status(200).json({ token });
    });
});

app.get('/chat/direct', jwtGuard, (req, res) => {
    db.query("SELECT * FROM chat_direct", (err, data, fields) => {
        if (err) {
            res.status(500).json({ error: "Unable to fetch the users. Database issue is at play here." })
        }

        // run the data through foreach and add messages

        res.status(200).json(data);
    });
});

app.post('/chat/direct', jwtGuard, (req, res) => {
    
});

app.delete('/chat/direct/:directChatId', jwtGuard, (req, res) => {
    // req.params.directChatId
});

app.post('/chat/direct/:directChatId/messeges', jwtGuard, (req, res) => {
    
});

app.get('/chat/groups', jwtGuard, (req, res) => {
    
});

app.post('/chat/groups', jwtGuard, (req, res) => {
    
});

app.put('/chat/groups/:chatGroupId', jwtGuard, (req, res) => {
    
});

app.delete('/chat/groups/:chatGroupId', jwtGuard, (req, res) => {
    
});

app.get('/chat/groups/:chatGroupId/messeges', jwtGuard, (req, res) => {
    
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
