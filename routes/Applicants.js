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
            resume.mimetype === 'application/msword' ||
            resume.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            cb(null, req.body.cv)
        } else {
            winston.error("File type:"+ resume.mimetype+
                " is incorrect")
        }
    }

});

const upload = multer({
    storage: storage,
    limits: {fileSize:4194304}
});

/**
 * Add a new HR applicant including Resume file
 */
applicants.post('/addapplicant', upload.single('resume'), async (req, res) => {

    winston.info("add applicant");
    try {
        let applicantMail = req.body.mail;
        let applicant = await Applicant.findOne({
            mail: applicantMail
        });
        if(!applicant) {
            let now = new Date();
            let data = {
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
            const newApplicant =  new Applicant(data);
            newApplicant.save(err => {
                if (err) {
                    winston.error(err);
                    res.status(500).json({'error':err})
                } else {
                    winston.info("Saved successfully");
                    res.status(200).json({message:'success'})
                }
            })
        }else {
            winston.info("Applicant "+ applicantMail + " already exists");
            res.json({error: 'User already exists'})
        }
    } catch (err) {
        winston.error(err);
        res.send('error: ' + err)
    }
});

/**
 * Edit a specific applicant detail, status
 */
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

/**
 * Get all applicants option to add a declined applicants
 */
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
        let applicants = await Applicant.find({})
            .where('stage').ne(showDeclined)
            .select('firstName lastName mobile role stage cv startDate  -_id');
        if(applicants) {
            let domain = process.env.DOMAIN ? process.env.DOMAIN : 'localhost'
            winston.info(JSON.stringify(applicants, null, 4));
            for(let i=0; i< applicants.length; i++ ) {
                applicants[i].cv = "https://"+domain
                    +":"
                    +process.env.PORT
                    +"/public/cv/"
                    + applicants[i].cv
            }

            winston.info(applicants)
            res.json({data: applicants})
        }else {
            res.json({error: "Applicants list is empty or unavailable"})
        }
    } catch (err) {
        winston.error(err);
        res.sendStatus(500).send('error: ' + err)
    }
});

/**
 * Get a specific applicant object before
 * redirecting to edit mode
 */
applicants.get('/getapplicant', async (req, res) => {
    try {
        let applicantId = req.query.mobile;
        winston.info("Get applicant data: "+ applicantId);
        let applicant = await Applicant.findOne({
            mobile: applicantId
        });
        winston.info("Finding applicant: " + applicant);
        if(applicant) {
            let data = {};
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

/**
 * Set applicant status to declined
 */
applicants.put('/decline', async (req, res) => {
    try{
        let applicantMobile = req.body.mobile;
        winston.info(applicantMobile);
        let applicant = await Applicant.findOne({
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