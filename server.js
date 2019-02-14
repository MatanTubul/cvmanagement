const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const winston = require('./config/winston');
const morgan = require('morgan');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const path = require('path');
process.env.PORT = process.env.PORT || 5000;
process.env.HOST = process.env.HOST || 'localhost';

const privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
const certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
const credentials = {key: privateKey, cert: certificate};
/**
 * Function which protect on server api using File-Store-Session
 * @param req
 * @param res
 * @param next
 */
function sessionHandler(req, res, next) {
    winston.info(req.url);
    if(req.url === '/login' ||
        req.url === '/forgotpassword' ||
        req.url === '/logout'
    ) {
        next()
    }else {
        if (req.session.sessionID) {
            next()
        } else {
            res.status(401).json({message:"Access is forbidden"})
        }
    }
}

// File-Store-Session options
const sess_options = {
    path:'./sessions/',
    reapAsync: true
};

// app.set('trust proxy', 1) // trust first proxy
app.use(session({
    store: new FileStore(sess_options),
    saveUninitialized: false,
    resave: false,
    secret: 'JcHTHqwBhZjbgAPYex2EudUS52hv5VpU',
    cookie: { maxAge: 24 * 60 * 60 * 1000
        ,secure: false, httpOnly: true, expires:false }
}));

app.use(bodyParser.json());
app.use(cors());
app.use(
    bodyParser.urlencoded({
        extended: false,
        limit:'50mb'
    })
);

app.use(bodyParser.json({limit:'50mb'}));
let mongoHost = process.env.NODE_ENV ? 'mongo' : "localhost"
const mongoURI = 'mongodb://root:edco123@'+mongoHost+':27017/cvmanagment';

mongoose.connect(mongoURI, {useNewUrlParser: true})
    .then(() => winston.info("MongoDB connected"))
    .catch(err => winston.error(err));

let Users = require('./routes/Users');
let Applicants = require('./routes/Applicants');

app.use('/api',sessionHandler, Users);
app.use('/api',sessionHandler,Applicants);

let staticPath = path.join(__dirname,'public/cv');
app.use(morgan('combined', { stream: winston.stream }));

app.use("/public/cv", sessionHandler, express.static(staticPath));

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname,'./client/build')));
    app.get("*", function (req, res) {
        res.attachment(path.resolve(__dirname, './client/build', 'index.html'));
    })

}

const httpsServer = https.createServer(credentials, app)
    .listen(process.env.PORT, process.env.HOST, function () {
        winston.info("Server is running: "
            +process.env.HOST
            +":"
            + process.env.PORT);
        winston.info("Build: "+ process.env.NODE_ENV)
        winston.info("Mongo Uri: "+ mongoURI)
    });

// app.listen(process.env.PORT, process.env.HOST, () => {
//     winston.info("Server is running: "
//         +process.env.HOST
//         +":"
//         + process.env.PORT);
//     winston.info("Build: "+ process.env.NODE_ENV)
// });