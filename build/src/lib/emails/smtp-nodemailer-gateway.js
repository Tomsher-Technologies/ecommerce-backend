"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smtpEmailGateway = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const smtpEmailGateway = async (emailDefaultValues, template) => {
    try {
        // Verify that environment variables are loaded correctly
        const transportOptions = {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT, 10),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        };
        const transporter = nodemailer_1.default.createTransport(transportOptions);
        const mailOptions = {
            from: `"${process.env.SHOPNAME}" <${process.env.SMTP_USER}>`, // Sender address
            to: emailDefaultValues.email,
            subject: emailDefaultValues.subject,
            html: template,
        };
        const response = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', response.messageId);
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
exports.smtpEmailGateway = smtpEmailGateway;
