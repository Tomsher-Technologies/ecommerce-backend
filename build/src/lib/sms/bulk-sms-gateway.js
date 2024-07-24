"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkSmsGateway = void 0;
const bulkSmsGateway = async (bulksmsValues) => {
    try {
        const response = await fetch(`${process.env.BULK_SMS_URL}?User=${process.env.BULK_SMS_USER}&passwd=${process.env.BULK_SMS_PASSWORD}&mobilenumber=${bulksmsValues.phone}%20&message=${bulksmsValues.message}&sid=${process.env.BULK_SMS_SID}&mtype=N&DR=N&key=${process.env.BULK_SMS_KEY}`, {
            method: "GET", // Use GET method as the API expects parameters in the URL
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.text();
        return responseData;
    }
    catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
};
exports.bulkSmsGateway = bulkSmsGateway;
