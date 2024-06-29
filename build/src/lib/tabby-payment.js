"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tabbyPaymentRetrieve = exports.tabbyCheckoutRetrieve = exports.tabbyPaymentCreate = void 0;
const cart_1 = require("../constants/cart");
const tabbyPaymentCreate = async (tabbyDefaultValues, paymentMethodValues) => {
    try {
        const response = await fetch(`${process.env.TABBY_API_URL}`, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${paymentMethodValues.testSecretKey}`
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: JSON.stringify(tabbyDefaultValues),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        if (responseData && responseData.status === cart_1.tabbyPaymentGatwayStatus.created) {
            return (0, exports.tabbyCheckoutRetrieve)(responseData.id);
        }
        // return responseData;
    }
    catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
exports.tabbyPaymentCreate = tabbyPaymentCreate;
const tabbyCheckoutRetrieve = async (tabbyId) => {
    try {
        const response = await fetch(`https://api.tabby.ai/api/v2/checkout/${tabbyId}`, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${process.env.TABBY_TEST_KEY}`
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
        });
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
exports.tabbyCheckoutRetrieve = tabbyCheckoutRetrieve;
const tabbyPaymentRetrieve = async (tabbyId) => {
    try {
        const response = await fetch(`https://api.tabby.ai/api/v2/payments/${tabbyId}`, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${process.env.TABBY_TEST_KEY}`
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
        });
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
exports.tabbyPaymentRetrieve = tabbyPaymentRetrieve;
