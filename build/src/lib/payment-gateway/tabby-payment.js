"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tabbyPaymentRetrieve = exports.tabbyCheckoutRetrieve = exports.tabbyPaymentCreate = void 0;
const cart_1 = require("../../constants/cart");
const tabbyPaymentCreate = async (tabbyDefaultValues, paymentMethodValues) => {
    try {
        const response = await fetch(`${process.env.TABBY_API_URL_CHECKOUT}`, {
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
            body: JSON.stringify(tabbyDefaultValues),
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        if (responseData && responseData.status === cart_1.tabbyPaymentGatwayStatus.created) {
            return (0, exports.tabbyCheckoutRetrieve)(responseData.id, paymentMethodValues);
        }
        // return responseData;
    }
    catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
exports.tabbyPaymentCreate = tabbyPaymentCreate;
const tabbyCheckoutRetrieve = async (tabbyId, paymentMethodValues) => {
    try {
        const response = await fetch(`${process.env.TABBY_API_URL_CHECKOUT}/${tabbyId}`, {
            method: "GET",
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
const tabbyPaymentRetrieve = async (tabbyId, paymentMethodValues) => {
    try {
        const response = await fetch(`${process.env.TABBY_API_URL_PAYMENT}/${tabbyId}`, {
            method: "GET",
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
