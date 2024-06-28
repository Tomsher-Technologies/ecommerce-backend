export const tabbyPaymentCreate = async (tabbyDefaultValues: any) => {
    try {
        const response = await fetch(`${process.env.TABBY_API_URL}`, {
            method: "POST",
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
            body: JSON.stringify(tabbyDefaultValues),
        });

        const responseData = await response.json();
        console.log('response', responseData);

        return responseData;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
