const https = require('https');

class PatientHelper {
    constructor(patientProfile) {
        this.patientProfile = patientProfile;

        this.getAllRecords = this.getAllRecords.bind(this);
        this.findRecord = this.findRecord.bind(this);
        this.matchesName = this.matchesName.bind(this);
        this.matchesPostcode = this.matchesPostcode.bind(this);
        this.matchesBirthday = this.matchesBirthday.bind(this);
    }

    matchesName(patient) {
        if (patient.name) {
            for (const nameEntry of patient.name) {
                if (nameEntry.use === 'official') {
                    const pName = nameEntry.given[0] + ' ' + nameEntry.family;
                    if (pName === this.patientProfile.name) {
                        return true;
                    }
                }
            }
            return false;
        } else {
            return false;
        }
    }

    matchesPostcode(patient) {
        if (patient.address) {
            for (const addressEntry of patient.address) {
                if (addressEntry.postalCode === this.patientProfile.postcode) {
                    return true;
                }
            }
            return false;
        } else {
            return false;
        }
    }

    matchesBirthday(patient) {
        const bday = this.patientProfile.dob.year + '-' + this.patientProfile.dob.month + '-' + this.patientProfile.dob.day;
        return patient.birthDate === bday;
    }

    findRecord() {
        return this.getAllRecords().then((data) => {
            const matches = [];
            for (const bundle of data) {
                for (const e of bundle.entry) {
                    if (e.resource) {
                        const p = e.resource;
                        if (this.matchesName(p) && this.matchesBirthday(p) && this.matchesPostcode(p)) {
                            matches.push(p);
                        }
                    }
                }
            }
            return matches;
        });
    }

    getAllRecords() {
        // process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
        return new Promise((resolve, reject) => {
            const req = https.request({
                host: 'localhost',
                port: 5001,
                path: '/api/Patient',
                method: 'GET',
                rejectUnauthorized: false,
                timeout: 10000
            },
            (resp) => {
                let data = '';
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                resp.on('end', () => {
                    resolve(JSON.parse(data));
                });
            });
            req.on('error', reject);
            req.end();
        });
    }
}

module.exports.PatientHelper = PatientHelper;
