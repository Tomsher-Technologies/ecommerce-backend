import { Response } from "express";
import path from "path";
import { checkRequiredColumns } from "../products";
import { excelProductVariantPriceAndQuantityRequiredColumn } from "../../../constants/admin/products";
const xlsx = require('xlsx');


export const excelUpload = async (req: any, filePath: string) => {
    const excelDatas = await xlsx.readFile(path.resolve(__dirname, `${filePath}${req.file?.filename}`));
    if (excelDatas && excelDatas.SheetNames[0]) {
        const productPriceSheetName = excelDatas.SheetNames[0];
        const productPriceWorksheet = excelDatas.Sheets[productPriceSheetName];
        if (productPriceWorksheet) {
            const excelFirstRow = xlsx.utils.sheet_to_json(productPriceWorksheet, { header: 1 })[0];
            const jsonData = await xlsx.utils.sheet_to_json(productPriceWorksheet);
            return jsonData
        } else {
            return { message: "Product price worksheet not found!" };
        }
    } else {
        return { message: "Sheet names not found!" };
    }

}