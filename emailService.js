require("dotenv").config();
const nodemailer = require("nodemailer");

async function sendMail(email,subject,mailbody){
    try{
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: 465,
            secure: true,
            auth:{
                user: process.env.SMTP_FROM_EMAIL,
                pass: process.env.SMTP_EMAIL_PASS
            }
        });
        
        await transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL,
            to: email,
            subject: subject,
            html: mailbody
        });
    }
    catch(e){
        throw e;
    }
}

module.exports = sendMail;
