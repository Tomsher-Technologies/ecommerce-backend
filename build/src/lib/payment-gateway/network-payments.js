"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkCreateOrderStatus = exports.networkCreateOrder = exports.networkAccessToken = void 0;
const networkAccessToken = async (paymentMethodValues) => {
    try {
        const response = await fetch(`${process.env.NETWORK_API_URL_ACCESS_TOKEN}`, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/vnd.ni-identity.v1+json",
                "Accept": "application/vnd.ni-identity.v1+json",
                "Authorization": `Basic ${paymentMethodValues.liveApiKey}`
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
exports.networkAccessToken = networkAccessToken;
const networkCreateOrder = async (networkDefaultValues, accessToken, paymentMethodValues) => {
    try {
        const response = await fetch(`${process.env.NETWORK_API_URL_ORDER}/${paymentMethodValues.liveReference}/orders`, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/vnd.ni-payment.v2+json",
                "Accept": "application/vnd.ni-payment.v2+json",
                "Authorization": `Bearer ${accessToken}`
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: JSON.stringify(networkDefaultValues),
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
exports.networkCreateOrder = networkCreateOrder;
const networkCreateOrderStatus = async (networkDefaultValues, accessToken, paymentMethodValues) => {
    try {
        const response = await fetch(`${process.env.NETWORK_API_URL_ORDER}/${paymentMethodValues.liveReference}/orders`, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/vnd.ni-payment.v2+json",
                "Accept": "application/vnd.ni-payment.v2+json",
                "Authorization": `Bearer ${accessToken}`
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
exports.networkCreateOrderStatus = networkCreateOrderStatus;
