const nodemailer = require("nodemailer");

/**
 *  Mailer util which send mails to users regarding password changes
 *  and registration
 */
const smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "mail",
        pass: "password"
        
    }
});
function setMailOptions(to, subject, html) {
    let mailOptions={
        from: "Cv Managment",
        to :to,
        subject : subject,
        html : html 
    };
    return mailOptions;
}

module.exports = {
    smtpTransport,
    setMailOptions
};