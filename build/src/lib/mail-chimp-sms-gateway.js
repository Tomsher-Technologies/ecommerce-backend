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
const mailChimpEmailGateway = async (ethisalatDefaultValues) => {
    try {
        const payload = {
            key: `${process.env.MAILCHIMP_API_KEY}`,
            message: {
                from_email: 'mail@timehouse.store', // Replace with your actual sender email
                subject: 'Hello World',
                text: 'This is a test email sent using Mailchimp Transactional Email API.',
                to: [
                    {
                        email: 'hannahabdulkader@gmail.com', // Replace with the actual recipient email
                        type: 'to'
                    }
                ]
            }
        };
        console.log('Sending request to:', 'https://mandrillapp.com/api/1.0/messages/send.json');
        const response = await fetch('https://mandrillapp.com/api/1.0/messages/send.json', {
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
