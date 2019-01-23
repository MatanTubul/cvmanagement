const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const winston = require('./config/winston');
const morgan = require('morgan');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const port = process.env.PORT || 5000;

/**
 * Function which protect on server api using File-Store-Session
 * @param req
 * @param res
 * @param next
 */
function sessionHandler(req, res, next) {
    winston.info(req.url)
    if(req.url === '/login' ||
        req.url === '/forgotpassword' ||
        req.url === '/logout'
    ) {
        next()
    }else {
        if (req.session.sessionID) {
            next()
        } else {
            res.status(403).json({message:"Access is forbidden"})
        }
    }
}

// File-Store-Session options
const sess_options = {
    path:'/tmp/sessions/',
    reapAsync: true
};

// app.set('trust proxy', 1) // trust first proxy
app.use(session({
    store: new FileStore(sess_options),
    saveUninitialized: false,
    resave: false,
    secret: 'JcHTHqwBhZjbgAPYex2EudUS52hv5VpU',
    cookie: { maxAge: 3600000,secure: false, httpOnly: true }
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
const mongoURI = 'mongodb://localhost:27017/cvmanagment';

mongoose.connect(mongoURI, {useNewUrlParser: true})
.then(() => winston.info("MongoDB connected"))
.catch(err => winston.error(err));

let Users = require('./routes/Users');
let Applicants = require('./routes/Applicants');

app.use('/api',sessionHandler, Users);
app.use('/api',sessionHandler,Applicants);
app.use(morgan('combined', { stream: winston.stream }));

app.listen(port, () => {
    winston.info("Server is running on port: " + port)
});