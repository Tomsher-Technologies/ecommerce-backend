"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfGenerator = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const pdfGenerator = async (html, res) => {
    const browser = await puppeteer_1.default.launch({
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
};
exports.pdfGenerator = pdfGenerator;
