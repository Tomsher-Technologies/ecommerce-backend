"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateConvertPm = exports.checkValueExists = exports.getIndexFromFieldName = exports.stringToArray = exports.isValidPriceFormat = exports.slugify = exports.uploadGallaryImages = exports.deleteFile = exports.deleteImage = exports.handleFileUpload = exports.formatZodError = exports.getCountryId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const fs_2 = __importDefault(require("fs"));
const product_service_1 = __importDefault(require("../services/admin/ecommerce/product-service"));
function getCountryId(userData) {
    if (userData && userData.userTypeID && userData.countryId) {
        if (userData.userTypeID.slug !== 'super-admin') {
            return new mongoose_1.default.Types.ObjectId(userData.countryId);
        }
    }
    return undefined;
}
exports.getCountryId = getCountryId;
const formatZodError = (errors) => {
    const formattedErrors = {};
    errors.forEach((err) => {
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
    });
    return formattedErrors;
};
exports.formatZodError = formatZodError;
const handleFileUpload = (req, data, file, fieldName, folderPath) => {
    if (data && data[fieldName]) {
        if (file) {
            (0, exports.deleteImage)(data, fieldName);
            console.log('${req.protocol}://${req.hostname}/${file.path}`', file);
            // return `${file.path}`; // Construct the URL using req.protocol and req.hostname
            return `/public/uploads/${folderPath}/${file.filename}`;
        }
        else {
            return data[fieldName];
        }
    }
    else {
        if (file) {
            // console.log('file',file.filename);
            return `/public/uploads/${folderPath}/${file.filename}`; // Construct the URL using req.protocol and req.hostname
        }
        else {
            return null;
        }
    }
};
exports.handleFileUpload = handleFileUpload;
const deleteImage = (data, fieldName) => {
    if (data && data[fieldName]) {
        const filePath = data[fieldName];
        if ((0, fs_1.existsSync)(filePath)) { // Check if the file exists before attempting deletion
            try {
                (0, promises_1.unlink)(filePath);
                console.log("Old file deleted successfully:", filePath);
            }
            catch (error) {
                console.error("Error deleting old file:", error);
            }
        }
        else {
            console.warn("File not found:", filePath);
        }
    }
    else {
        console.warn("Field not found in data object or data object is empty.");
    }
};
exports.deleteImage = deleteImage;
const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs_2.default.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                reject(err);
            }
            else {
                console.log('File deleted successfully:', filePath);
                resolve();
            }
        });
    });
};
exports.deleteFile = deleteFile;
const uploadGallaryImages = async (req, Id, galleryImages) => {
    try {
        await Promise.all(galleryImages.map(async (galleryImage) => {
            var galleryImageData;
            if (Id.variantId) {
                galleryImageData = {
                    variantId: Id.variantId,
                    galleryImageUrl: (0, exports.handleFileUpload)(req, null, galleryImage, 'galleryImageUrl', 'product'),
                    status: '1'
                };
            }
            else {
                galleryImageData = {
                    productID: Id,
                    galleryImageUrl: (0, exports.handleFileUpload)(req, null, galleryImage, 'galleryImageUrl', 'product'),
                    status: '1'
                };
            }
            await product_service_1.default.createGalleryImages(galleryImageData);
        }));
    }
    catch (error) {
        console.log('errorerrorerror', error);
        // Handle errors
    }
};
exports.uploadGallaryImages = uploadGallaryImages;
// export const deleteImage = (data: any, fieldName: string): boolean => {
//     if (data && data[fieldName]) {
//         const filePath = data[fieldName];
//         try {
//             unlink(filePath);
//             return true;
//         } catch (error) {
//             console.error("Error deleting old file:", error);
//             return false;
//         }
//     } else {
//         console.warn("Field not found in data object or data object is empty.");
//         return false;
//     }
// };
const slugify = (text, slugDiff = '-') => {
    return text.toLowerCase().replace(/[^\w\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
        .replace(/\s+/g, slugDiff) // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
        .trim(); // Trim leading and trailing spaces
};
exports.slugify = slugify;
const isValidPriceFormat = (value) => {
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    return priceRegex.test(value);
};
exports.isValidPriceFormat = isValidPriceFormat;
const stringToArray = (input) => {
    if (input) {
        const trimmedInput = input.trim();
        const arrayResult = trimmedInput.split(',');
        const trimmedArray = arrayResult.map(item => item.trim());
        return trimmedArray;
    }
    else {
        return [];
    }
};
exports.stringToArray = stringToArray;
const getIndexFromFieldName = (fieldname, keyValue) => {
    const match = fieldname?.match(new RegExp(`${keyValue}\\[(\\d+)\\]`));
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    return -1;
};
exports.getIndexFromFieldName = getIndexFromFieldName;
const checkValueExists = (obj, value) => {
    return Object.values(obj).includes(value);
};
exports.checkValueExists = checkValueExists;
const dateConvertPm = (input) => {
    return new Date(`${input}T23:59:59.999Z`);
};
exports.dateConvertPm = dateConvertPm;