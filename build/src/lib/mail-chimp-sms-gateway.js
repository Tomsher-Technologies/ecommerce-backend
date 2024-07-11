"use strict";
// const mailchimp = require('@mailchimp/mailchimp_transactional')(`${process.env.MAILCHIMP_API_KEY}`);
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailChimpEmailGateway = void 0;
// export const mailChimpEmailGateway = async (mailChimpValues: any) => {
//     try {
//         const response = await mailchimp.messages.send({
//             message: {
//                 from_email: 'mail@timehouse.store', // Replace with your actual sender email
//                 subject: 'Hello World',
//                 text: 'This is a test email sent using Mailchimp Transactional Email API.',
//                 to: [
//                     {
//                         email: mailChimpValues.email, // Replace with the actual recipient email
//                         type: 'to'
//                     }
//                 ]
//             }
//         });
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response}`);
//         }
//         console.log("response :", response);
//     } catch (error: any) {
//         console.error('Error:', error.response, error.message);
//         throw error;
//     }
// }
// import htmlContent from '../view/email-otp';
const mailChimpEmailGateway = async (emailDefaultValues, template) => {
    try {
        const payload = {
            key: `${process.env.MAILCHIMP_API_KEY}`,
            message: {
                from_email: `${process.env.MAILCHIMP_API_EMAIL}`, // Replace with your actual sender email
                subject: emailDefaultValues.subject,
                html: template,
                to: [
                    {
                        email: emailDefaultValues.email, // Replace with the actual recipient email
                        type: 'to'
                    }
                ]
            }
        };
        const response = await fetch(`${process.env.MAILCHIMP_API_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        // console.log('response', response);
        if (!response.ok) {
            const responseData = await response.json();
            console.log('response', responseData);
            throw new Error(`HTTP error! status: ${responseData}`);
        }
        const responseData = await response.json();
        return responseData;
    }
    catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
};
exports.mailChimpEmailGateway = mailChimpEmailGateway;
