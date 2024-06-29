const apiUrl = 'https://api.your-sms-gateway.com/send-sms'; // Replace with your actual API URL
const auth = 'Bearer your-auth-token'; // Replace with your actual authorization token
const accountId = 'your-account-id'; // Replace with your actual account ID
export const mailChimpSmsGateway = async (mailChimpValues: any) => {

    try {
        console.log('Starting fetch request to:', apiUrl);
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': auth,
                'Content-Type': 'application/json',
                'X-Account-ID': accountId,
            },
            body: JSON.stringify({
                sender: 'TIME HOUSE TRADING LLC',
                recipient: '+971556151476',
                message: 'Hello from Etisalat SMS Gateway!',
            }),
        });

        console.log('Fetch request completed.');

        const contentType = response.headers.get('content-type');
        const responseText = await response.text(); // Read the response text

        // Log the full response text for debugging
        console.log('Response text:', responseText);

        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
        }

        if (!response.ok) {
            console.error('HTTP error! Status:', response.status);
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const responseData = JSON.parse(responseText); // Parse the JSON manually
        console.log('SMS Sent Successfully');
        console.log(responseData); // Handle response as needed

        return responseData;
    } catch (error) {
        console.error('Error:', error);
        throw error; // Rethrow the error to propagate it up the call stack if needed
    }
}