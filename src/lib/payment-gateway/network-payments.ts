export const networkAccessToken = async (paymentMethodValues: { liveApiKey: string; }) => {
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
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

export const networkCreateOrder = async (networkDefaultValues: any, accessToken: string,paymentMethodValues: { liveReference: string; }) => {
    try {
        const response = await fetch(`${process.env.NETWORK_API_URL_CREATE_ORDER}/${paymentMethodValues.liveReference}/orders`, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/vnd.ni-identity.v1+json",
                "Accept": "application/vnd.ni-identity.v1+json",
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
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
