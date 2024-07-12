import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export const smtpEmailGateway = async (emailDefaultValues: any, template: any) => {
    try {
        // Verify that environment variables are loaded correctly
        const transportOptions: SMTPTransport.Options = {
            host: process.env.SMTP_HOST as string,
            port: parseInt(process.env.SMTP_PORT as string, 10),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER as string,
                pass: process.env.SMTP_PASS as string
            },
            tls: {
                rejectUnauthorized: false
            }
        };

        const transporter = nodemailer.createTransport(transportOptions);

        const mailOptions: nodemailer.SendMailOptions = {
            from: process.env.SMTP_USER as string, // Sender address
            to: emailDefaultValues.email,
            subject: emailDefaultValues.subject,
            html: template,
        };

        const response = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', response.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};