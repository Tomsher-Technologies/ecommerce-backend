export const tapPaymentCreate = async (tapDefaultValues: any) => {
    try {
        const response = await fetch(`${process.env.TAP_API_URL}`, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": `Bearer ${process.env.TAP_TEST_KEY}`
            },
            redirect: "follow",
            referrerPolicy: "no-referrer",
            body: JSON.stringify(tapDefaultValues),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        // console.log('response', responseData);

        return responseData;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

export const tapPaymentRetrieve = async (tapId: string | string[]) => {
    try {
        const response = await fetch(`${process.env.TAP_API_URL}/${tapId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Authorization": "Bearer sk_test_XKokBfNWv6FIYuTMg5sLPjhJ"
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
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
