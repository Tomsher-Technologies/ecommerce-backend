import puppeteer, { Browser } from 'puppeteer';
import { Response } from 'express';

interface PdfGeneratorOptions {
    html: any;
    res: Response;
    preview: any;
    bulkExport?: boolean
}

export const pdfGenerator = async ({ html, res, preview, bulkExport = false }: PdfGeneratorOptions) => {
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
        let combinedHtml = null;
        if (bulkExport) {
            combinedHtml = `
            <html>
            <head><style>/* Add your styles here */</style></head>
            <body>
                ${html.join('<div style="page-break-after: always;"></div>')}
            </body>
            </html>
        `;
        }

        await page.setContent(bulkExport ? combinedHtml : html, {
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
