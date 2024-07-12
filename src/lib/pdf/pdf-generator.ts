import puppeteer, { Browser } from 'puppeteer';
import { Response } from 'express';

interface PdfGeneratorOptions {
    html: string;
    res: Response;
}

export const pdfGenerator = async ({ html, res }: PdfGeneratorOptions) => {
    let browser: Browser | null = null;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
            ],
            executablePath: '/usr/bin/chromium-browser',
            ignoreDefaultArgs: ['--disable-extensions'],
            timeout: 60000,
        });

        const page = await browser.newPage();

        await page.setContent(html, {
            waitUntil: 'networkidle2',
            timeout: 60000,
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=invoice.pdf',
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);

        await page.close();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Failed to generate PDF');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};