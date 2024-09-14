"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.excelUpload = void 0;
const path_1 = __importDefault(require("path"));
const xlsx = require('xlsx');
const excelUpload = async (req) => {
    const excelDatas = await xlsx.readFile(path_1.default.resolve(__dirname, `../../../../public/uploads/product/excel/${req.file?.filename}`));
    if (excelDatas && excelDatas.SheetNames[0]) {
        const productPriceSheetName = excelDatas.SheetNames[0];
        const productPriceWorksheet = excelDatas.Sheets[productPriceSheetName];
        if (productPriceWorksheet) {
            const excelFirstRow = xlsx.utils.sheet_to_json(productPriceWorksheet, { header: 1 })[0];
            const jsonData = await xlsx.utils.sheet_to_json(productPriceWorksheet);
            return jsonData;
        }
        else {
            return { message: "Product price worksheet not found!" };
        }
    }
    else {
        return { message: "Sheet names not found!" };
    }
};
exports.excelUpload = excelUpload;
