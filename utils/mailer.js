var nodemailer = require("nodemailer");
var xoauth2 = require('xoauth2');
var transport = require('nodemailer-smtp-transport');

const smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "managmentcv@gmail.com",
        pass: "Q96mA22w6T"
        
    }
});
function setMailOptions(to, subject, html) {
    mailOptions={
        from: "Cv Managment",
        to :to,
        subject : subject,
        html : html 
    }
    return mailOptions;
}

module.exports = {
    smtpTransport,
    setMailOptions
}