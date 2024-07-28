"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tamaraAutoriseOrder = exports.tamaraCheckout = void 0;
const tamaraCheckout = async (tamaraDefaultValues, paymentMethodValues) => {
    try {
        console.log('process.env.TAMARA_API_URL', paymentMethodValues.liveApiKey);
        const response = await fetch(`${process.env.TAMARA_API_URL}/checkout`, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${paymentMethodValues.liveApiKey}`
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: JSON.stringify(tamaraDefaultValues),
        });
        if (!response) {
            throw new Error(`HTTP error! status: ${response?.status}`);
        }
        const responseData = await response.json();
        return responseData;
    }
    catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
exports.tamaraCheckout = tamaraCheckout;
const tamaraAutoriseOrder = async (orderId, paymentMethodValues) => {
    try {
        const response = await fetch(`${process.env.TAMARA_API_URL}/orders/${orderId}/authorise`, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Authorization": `Bearer ${paymentMethodValues.liveApiKey}`
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
        });
        if (!response) {
            throw new Error(`HTTP error! status: ${JSON.stringify(response)}`);
        }
        const responseData = await response.json();
        return responseData;
    }
    catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
exports.tamaraAutoriseOrder = tamaraAutoriseOrder;
