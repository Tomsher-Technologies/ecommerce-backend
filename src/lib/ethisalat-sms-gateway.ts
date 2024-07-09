
export const etisalatSmsGateway = async (ethisalatDefaultValues: any) => {
    try {
        const auth = 'Basic ' + btoa(`${'Ka477b286-20b7-4ad7-a285-878f100a93a9'}:${'S237a387d-c9e4-4362-8652-3212a695d53f'}`)
        const response = await fetch('https://consentportal.etisalatdigital.ae', {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                'Authorization': auth,
                'Content-Type': 'application/json',
                'X-Account-ID': "767300020",
                'X-Api-Key': 'Ka477b286-20b7-4ad7-a285-878f100a93a9',
                'X-Api-Secret': 'S237a387d-c9e4-4362-8652-3212a695d53f',
            },
            body: JSON.stringify({
                sender: 'TIME HOUSE TRADING LLC',
                recipient: '+971556151476',
                message: 'Hello from Etisalat SMS Gateway!',
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        // console.log('response', responseData);

        return responseData;
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }

}


