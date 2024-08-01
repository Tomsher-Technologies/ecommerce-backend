import { Response } from 'express';
import * as XLSX from 'xlsx';

export const generateExcelFile = async (
    res: Response,
    excelData: any[],
    headers: string[],
    title: string
): Promise<void> => {
    try {
        const worksheet = XLSX.utils.json_to_sheet(excelData, { header: headers });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, title);

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${title.toLowerCase()}.xlsx`);

        res.send(buffer);
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('An error occurred while generating the Excel file.');
    }
};
