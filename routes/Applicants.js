const express = require("express");
const applicants = express.Router();
const cors = require("cors");
const winston = require('../config/winston');
const Applicant = require("../models/Applicant");
const multer  = require('multer');
const pathBase = process.env.PWD;
const dateFormat = require('dateformat');
applicants.use(cors());
const storage = multer.diskStorage({
    destination: function (req,file,cb) {
        console.log(req.body.mail);
        cb(null, pathBase+'/public/cv/')
    },
    filename: function (req, resume, cb) {
        if (resume.mimetype === 'application/pdf' ||
            resume.mimetype === 'application/msword') {
            var ext = resume.mimetype.split('/')[1];
            cb(null, req.body.mail.split("@")[0]+'.'+ext)
        }
    }

});
const upload = multer({
    storage: storage,
    limits: {fileSize:4194304}
});

applicants.post('/addapplicant', upload.single('resume'), async (req, res) => {

    winston.info("add applicant");
    try {
        let applicantMail = req.body.mail;
        let applicant = await Applicant.findOne({
            mail: applicantMail
        });
        if(!applicant) {
            let now = new Date();
            data = {
                firstName: req.body.fname,
                lastName: req.body.lname,
                mobile: req.body.mobile,
                email: req.body.mail,
                citizenship: req.body.citizenship,
                address: req.body.address,
                role: req.body.role,
                stage: req.body.stage,
                appliedby: req.body.appliedby,
                cv: req.body.cv,
                note: req.body.note,
                startDate: dateFormat(now, "dd-mm-yyyy")
            };
            winston.info("Add applicant:" +JSON.stringify(data, null, 2));
            var newApplicant = new Applicant(data);
            newApplicant.save(err => {
                if (err) {
                    winston.error(err);
                    res.json({'error':err})
                } else {
                    winston.info("Saved successfully");
                    res.json({message:'success'})
                }
            })
            // res.json({message:'success'})
            // TODO add applicant base on
            //  "https://medium.freecodecamp.org/how-to-create-file-upload-with-react-and-node-2aa3f9aab3f0"

        }else {
            winston.info("Applicant "+ applicantMail + " already exists");
            res.json({error: 'User already exists'})
        }
    } catch (err) {
        winston.error(err);
        res.send('error: ' + err)
    }
});

applicants.put('/editapplicant', upload.single('resume'),async (req, res) => {
    try {
        let applicantMail = req.body.mail;
        winston.info(applicantMail);
        let applicant = await Applicant.findOne({
            email: applicantMail
        });
        if(!applicant) {
            res.status(404).json({'error':'Failed to update applicant' +
                ', not found'})
        }else {
            applicant.firstName = req.body.fname;
            applicant.lastName = req.body.lname;
            applicant.mobile = req.body.mobile;
            applicant.citizenship = req.body.citizenship;
            applicant.address = req.body.address;
            applicant.role = req.body.role;
            applicant.stage = req.body.stage;
            applicant.appliedby = req.body.appliedby;
            if('cv' in req.body){
                applicant.cv = req.body.cv
            }
            applicant.note = req.body.note;
            applicant.save(err => {
                if (err) {
                    winston.error(err);
                    res.json({'error':err})
                } else {
                    winston.info("Update successfully");
                    res.json({message:'success'})
                }
            })
        }
    }catch (err) {
        winston.error(err);
        res.sendStatus(500).send('error: ' + err)
    }
});

applicants.get('/applicants', async (req, res) => {
    try {
        // winston.info(req.session.token)
        winston.info("GET applicants list with declined status "+req.query.declined);
        let filterDeclinedApplicants = req.query.declined;
        let showDeclined = '';
        if(filterDeclinedApplicants === 'false') {
            winston.info("Users which not declined");
            showDeclined = 'Declined'
        }
        const applicants = await Applicant.find({})
            .where('stage').ne(showDeclined)
            .select('firstName lastName mobile role stage cv startDate  -_id');
        if(applicants) {
            winston.info(JSON.stringify(applicants, null, 4));
            res.json({data: applicants})
        }else {
            res.json({error: "Applicants list is empty or unavailable"})
        }
    } catch (err) {
        winston.error(err);
        res.sendStatus(500).send('error: ' + err)
    }
});

applicants.get('/getapplicant', async (req, res) => {
    try {
        let applicantId = req.query.mobile;
        winston.info("Get applicant data: "+ applicantId);
        applicant = await Applicant.findOne({
            mobile: applicantId
        });
        winston.info("Finding applicant: " + applicant);
        if(applicant) {
            data = {};
            data['fname'] = applicant.firstName;
            data['lname'] = applicant.lastName;
            data['mobile'] = applicant.mobile;
            data['mail'] = applicant.email;
            data['citizenship'] = applicant.citizenship;
            data['address'] = applicant.address;
            data['position'] = {value: applicant.role.toLowerCase(),
                label:applicant.role};
            data['stage'] = {value: applicant.stage.toLowerCase(),
                label:applicant.stage};
            data['appliedBy'] = applicant.appliedby;
            data['note'] = applicant.note;
            res.json({data: data})
        }else {
            res.status(404).json({'error':'Failed to find applicant'})
        }
    } catch(err) {
        winston.error(err)-
        res.sendStatus(500).send('error: ' + err)
    }
});

applicants.put('/decline', async (req, res) => {
    try{
        let applicantMobile = req.body.mobile;
        winston.info(applicantMobile);
        applicant = await Applicant.findOne({
            mobile: applicantMobile
        });
        winston.info(applicant);
        if(applicant) {
            applicant.stage = 'Declined';
            applicant.save(function(err) {
                if (err) {
                    winston.error(err);
                    res.json({error:err})
                }else {
                    res.json({data:'Applicant declined'})
                }
            })
        }else {
            res.status(404).json({'error':'Failed to decline applicant' +
                ', not found'})
        }
    }catch (err) {
        winston.error(err);
        res.sendStatus(500).send('error: ' + err)
    }
});


module.exports = applicants;