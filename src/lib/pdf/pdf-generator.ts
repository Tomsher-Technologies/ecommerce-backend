import puppeteer, { Browser } from 'puppeteer';
import { Response } from 'express';

interface PdfGeneratorOptions {
    html: string;
    res: Response;
    preview: any;
}

export const pdfGenerator = async ({ html, res, preview }: PdfGeneratorOptions) => {
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
            // executablePath: '/usr/bin/chromium-browser',
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

        if (preview == '1') {
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename=invoice.pdf',
                'Content-Length': pdfBuffer.length,
            });
            res.send(pdfBuffer);
        } else {
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=invoice.pdf',
                'Content-Length': pdfBuffer.length,
            });
            res.send(pdfBuffer);
        }

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


interface PdfGeneratorOptions1 {
    htmlArray: string[]; // Array of HTML strings
    res: Response;
    preview: any;
}

export const bulkPdfGenerator = async ({ htmlArray, res, preview }: PdfGeneratorOptions1) => {
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
            ignoreDefaultArgs: ['--disable-extensions'],
            timeout: 60000,
        });

        // Combine all HTML strings into a single document
        const combinedHtml = `
            <html>
            <head><style>/* Add your styles here */</style></head>
            <body>
                ${htmlArray.join('<div style="page-break-after: always;"></div>')}
            </body>
            </html>
        `;

        const page = await browser.newPage();
        await page.setContent(combinedHtml, {
            waitUntil: 'networkidle2',
            timeout: 60000,
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        });

        await page.close();

        if (preview === '1') {
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline; filename=invoice_preview.pdf',
                'Content-Length': pdfBuffer.length,
            });
            res.send(pdfBuffer);
        } else {
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename=invoice.pdf',
                'Content-Length': pdfBuffer.length,
            });
            res.end(pdfBuffer);
        }

    } catch (error) {
        console.error('Error generating PDF:', error);
        if (!res.headersSent) {
            res.status(500).send('Failed to generate PDF');
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};



