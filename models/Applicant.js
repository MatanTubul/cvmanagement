const mongoose = require("mongoose").set('debug',true)
const Schema = mongoose.Schema;

/**
 * Applicant model
 */
const ApplicantSchema = new Schema({
    firstName: {
        required: true,
        type: String

    },
    lastName: {
        required: true,
        type: String
    },
    mobile : {
        required: true,
        type: String
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    citizenship: {
        type: String,
    },
    address: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['Research', 'Development', 'Administration', 'QA', 'DevOps', 'Projects', 'Sales', 'Presale', 'CSM',
        'Seniors']
    },
    stage: {
        type: String,
        required: true,
        enum: ['Exams', 'HR','Eli interview', 'Yuval interview', 'Nhevo interview', 'Escape room', 'Presentation' ,
        'References', 'Background check', 'Job offer', 'Polygraph', 'Declined']
    },
    cv: {
        type: String,
        required: true
    },
    note: {
        type: String
    },
    appliedby: {
        type: String
    },
    startDate: {
        type:String,
        required: true
    }
});

module.exports = Applicant = mongoose.model('applicants', ApplicantSchema);