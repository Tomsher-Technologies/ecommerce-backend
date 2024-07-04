import { tabbyPaymentGatwayStatus } from "../constants/cart";

export const tabbyPaymentCreate = async (tabbyDefaultValues: any, paymentMethodValues: { secretKey: string; publicKey: string; testSecretKey: string; testPublicKey: string }) => {
    try {
        const response = await fetch(`${process.env.TABBY_API_URL}`, {
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

        if (responseData && responseData.status === tabbyPaymentGatwayStatus.created) {
            return tabbyCheckoutRetrieve(responseData.id, paymentMethodValues)
        }
        // return responseData;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}


export const tabbyCheckoutRetrieve = async (tabbyId: any, paymentMethodValues: any) => {
    try {

        const response = await fetch(`https://api.tabby.ai/api/v2/checkout/${tabbyId}`, {
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
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

export const tabbyPaymentRetrieve = async (tabbyId: any, paymentMethodValues: any) => {
    try {

        const response = await fetch(`https://api.tabby.ai/api/v2/payments/${tabbyId}`, {
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
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}