import puppeteer from 'puppeteer';

export const pdfGenerator = async (html: any, res: any) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ],
        timeout: 60000
    });
    const page = await browser.newPage();

    await page.setContent(html, {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();
    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=invoice.pdf',
        'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
}