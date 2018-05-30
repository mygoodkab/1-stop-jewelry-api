import { Util } from './util';
import { config } from './config';
// import * as mailgun from 'mailgun-js'({apiKey: api_key, domain: domain})
const api_key = process.env.API_KEY_MAILGUN || config.dev.mail.API_KEY; // ;
const domain = config.dev.mail.DOMAIN;
const mailgun = require('mailgun-js')({ apiKey: api_key, domain: domain });
// const sgMail = require('@sendgrid/mail');
const mail = (mailOption: object) => {

    // setup email data with unicode symbols
    // const mailOptions = {
    //     from: `no-reply<no-reply@mg.codth.com>`, // sender address
    //     to: option.receiver, // adoma@adoma-jewel-manufact.com

    //     subject: `Adoma`, // Subject line
    //     html: `<b>Company Name : </b> ${option.companyName} <br>
    //                <b>Person Name : </b> ${option.personName} <br>
    //                <b>Email Address : </b> ${option.email} <br>
    //                <b>Address : </b> ${option.address} <br>
    //                <b>Inquiry : </b> ${option.inquiry} <br>
    //                 ` // html body
    // };
    return new Promise((resolve, reject) => {
        // send mail with defined transport object
        mailgun.messages().send(mailOption, (error, body) => {
            if(error){
                reject(error);
            }
            resolve(body);
        });
    });
};

export { mail };
