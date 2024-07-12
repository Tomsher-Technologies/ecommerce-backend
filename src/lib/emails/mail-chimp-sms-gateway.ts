export const mailChimpEmailGateway = async (emailDefaultValues: any, template: any) => {
    try {
        const payload = {
            key: `${process.env.MAILCHIMP_API_KEY}`,
            message: {
                from_email: `${process.env.MAILCHIMP_API_EMAIL}`, // Replace with your actual sender email
                subject: emailDefaultValues.subject,
                html: template,
                to: [
                    {
                        email: emailDefaultValues.email, // Replace with the actual recipient email
                        type: 'to'
                    }
                ]
            }
        };

        const response = await fetch(`${process.env.MAILCHIMP_API_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        // console.log('response', response);

        if (!response.ok) {
            const responseData = await response.json();
            console.log('response', responseData);

            throw new Error(`HTTP error! status: ${responseData}`);
        }

        const responseData = await response.json();

        return responseData;
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
}