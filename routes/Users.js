const express = require("express");
const users = express.Router();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const generator = require('generate-password');
const winston = require('../config/winston')
const User = require("../models/User");
const mailer = require("../utils/mailer")
const crypto = require('crypto');

users.use(cors());
const BCRYPT_SALT_ROUNDS = 10;
process.env.SECRET_KEY = 'HqW6;zv=;Kp8*{mj<ynIT5u"@,%hAz<bA)<Vc57IsU<q(cdQ4Qu%~`sX<9(t(q{'

function genuuid() {
    var sha = crypto.createHash('sha256');
    sha.update(Math.random().toString());
    return sha.digest('hex');
}

/**
 *  Register a new user
 */
users.post('/register',  async (req, res) => {
    let user
    try {
        user =  await User.findOne({
            userName: req.body.userName
        })
        winston.info('User: '+ user + " try to register")
        if(!user) {
            const userData = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                userName: req.body.userName,
                password: generator.generate({
                    length: 8,
                    numbers: true
                })
            }
            // Setup mail for new user
            winston.info("Sending registration succesful mail to user "+ user)
            let mail = mailer.setMailOptions(
                req.body.userName,
                "Welcome to CvManagment",
                ["Hello "+req.body.firstName+",<br><br> use attached password "+userData.password,
                " in order to sign in to CvManagment.<br>"
                ].join('')
            )
            // save hashed password and sending mail to new user including is password
            bcrypt.hash(userData.password, BCRYPT_SALT_ROUNDS , (err, hash) => {
                userData.password = hash
                User.create(userData)
                .then(user => {
                    mailer.smtpTransport.sendMail(mail, function(error, response) {
                        if (error) {
                            winston.error(error)
                        } else {
                            winston.info("Mail sent: " + response.message)
                        }
                    }) 
                    res.json({message: user.userName + ' registered'})
                   
                })
                .catch(err => {
                    res.json('error: ' + err)
                })
            })
        } else {
            winston.info("User registration failed")
            res.json({error: 'User already exists'})
        }

    } catch (err) {
        winston.error(err)
        res.sendStatus(500).send('error: ' + err)
    }
})

/**
 *  Login endpoint
 */
users.post('/login', async (req, res) => {
    let user
    try {
        user = await User.findOne({
            userName: req.body.userName,
            isDeleted: false
        })
        winston.info('User: '+ user + " try to login")
        if (user) {
            if(bcrypt.compareSync(req.body.password, user.password)) {
                const payload = {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    userName: user.userName
                }
                winston.info("Password is correct")
                let token = jwt.sign(payload, process.env.SECRET_KEY, {
                    expiresIn: 1440
                })
                req.session.sessionID = genuuid()
                winston.info("session %j", req.session)
                res.json({message: token})
            } else {
                req.session.destroy()
                res.json({ error: "Credentials is incorrect "})
            }
        } else {
            res.json({ error: "User does not exist"})
        }
    } catch (err) {
        winston.error(err)
        res.sendStatus(500).send('error: ' + err)
    }
})

users.post('/forgotpassword', async (req, res) => {
    
    try {
        user = await User.findOne({
            userName: req.body.userName,
            isDeleted: false
        })
        winston.info('User: '+ user + " try to reset password id:" + user._id)
        if (user) {
            const token = crypto.randomBytes(20).toString('hex')
            user.resetPasswordToken = token 
            user.resetPasswordExpires = Date.now() + 360000
            user.save(function(err) {
                if (err) {
                    winston.error(err)
                }
            })
            

            // Sending reset password link to user mail
            const mailOptions = mailer.setMailOptions(
                user.userName,
                'CvManagment Link to Reset Password',
                ["Hello " +user.firstName+ ",<br><br>",
                "You received this email because we received a request for reset the password for your account.<br>", 
                "If you did not request reset the password for your account, you can safely delete this email.<br>",
                "In order to reset your account password please click on the attached Link:<br>", 
                "http://localhost:3000/reset/"+token+"<br>"
            ].join(''))

            mailer.smtpTransport.sendMail(mailOptions, function(error, response) {
                if (error) {
                    winston.error(error)
                } else {
                    winston.info("Mail sent to: " + user.userName)
                }
            })
            res.status(200).json({message: "recovery email sent"})
        } else {
            res.json({ error: "User does not exist"})
        }
    } catch (err) {
        winston.error(err)
        res.sendStatus(500).send('error: ' + err)
    }
})

users.get('/verifytoken', async (req, res, next) => {
    winston.info("Verify token: "+ req.query.resetPasswordToken)
    try {
        user =  await User.findOne({
            resetPasswordToken: req.query.resetPasswordToken
        })
        .where('resetPasswordExpires').gt(new Date())
        .select('userName')
       
        winston.info(user)

        if (!user) {
            winston.info('Password reset link is invalid')
            res.json({error: "Link is invalid"})
        } else {
            winston.info('Password reset link is valid')
            winston.info(user.userName)
            res.json({
                userName: user.userName,
                message: 'Password reset link is valid'
            })
        }
    
    } catch (err) {
        winston.error(err)
        res.sendStatus(500).send('error: ' + err)
    }
    
})

users.post('/resetpassword', async  (req, res) => {
    try {
        const password = req.body.password
        user = await User.findOne({
            userName: req.body.userName
        })
        if(user) {
            winston.info("Updating password for user: "+user)
            bcrypt.hash(password, BCRYPT_SALT_ROUNDS , (err, hash) => {
                winston.info(hash)
                user.password = hash
                user.save(function(err) {
                    if (err) {
                        winston.error(err)
                        res.sendStatus(500).json({'error':err})

                    }else {
                        res.json({message:'Successfully reset password'})
                    }
                })
            } )
        }else {
            res.sendStatus(403).json({'error':'Failed to reset password'})
        }

    }catch (e) {
        winston.error(e)
        res.sendStatus(500).json({'error':e})
    }
})

users.get('/users', async (req, res, next) => {
    try {
        winston.info("get users list")
        const users =  await User.find({
            isDeleted: false
        }).select('firstName lastName userName -_id')

        winston.info("Users: "+ users)
        if(users) {
            res.json({data: users})
        } else {
            res.json({error: "Users list is empty or unavailable"})
        }
    }catch (err) {
        winston.error(err)
        res.sendStatus(500).send('error: ' + err)
    }
   
})

users.put('/deleteuser', async  (req,res) => {
    try {
        let userToDelete = req.body.userName
        user =  await User.findOne({
            userName: userToDelete
        })
        if (user) {
            winston.info("Deleting user "+ user)
            user.isDeleted=true
            user.save(function(err) {
                if (err) {
                    winston.error(err)
                }else {
                    res.json({message:'User deleted'})
                }
            })
        }else {
            res.status(404).json({'error':'Failed to delete user, not found'})
        }
    }catch (err) {
        winston.error(err)
        res.sendStatus(500).send('error: ' + err)

    }
})

users.put('/logout', async  (req,res) => {
    try {
        winston.info('Logout: destroy session')
        req.session.destroy(function (err) {
            if (err) {
                winston.error(err)
                res.status(500).send('error: ' + err)
            } else {
                res.json({data: 'ok'})
            }
        })
    } catch (e) {
    }
})

module.exports = users