"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tapPaymentRetrieve = exports.tapPaymentCreate = void 0;
const tapPaymentCreate = async (tapDefaultValues, paymentMethodValues) => {
    try {
        const response = await fetch(`${process.env.TAP_API_URL}`, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${paymentMethodValues.secretKey}`
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: JSON.stringify(tapDefaultValues),
        });
        console.log('response', tapDefaultValues);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        return responseData;
    }
    catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
exports.tapPaymentCreate = tapPaymentCreate;
const tapPaymentRetrieve = async (tapId, paymentMethodValues) => {
    try {
        const response = await fetch(`${process.env.TAP_API_URL}/${tapId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${paymentMethodValues.secretKey}`
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        // console.log('response', responseData);
        return responseData;
    }
    catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
exports.tapPaymentRetrieve = tapPaymentRetrieve;
