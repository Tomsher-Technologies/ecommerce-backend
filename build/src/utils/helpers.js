"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roundToTwo = exports.formatAmount = exports.truncateWord = exports.normalizeWord = exports.calculateExpectedDeliveryDate = exports.calculateWalletRewardPoints = exports.calculateTotalDiscountAmountDifference = exports.uploadImageFromUrl = exports.capitalizeWords = exports.calculateWalletAmount = exports.generateOTP = exports.dateConvertPm = exports.checkValueExists = exports.getIndexFromFieldName = exports.stringToArray = exports.isValidPriceFormat = exports.categorySlugifyManually = exports.categorySlugify = exports.slugify = exports.uploadGallaryImages = exports.deleteFile = exports.deleteImage = exports.handleFileUpload = exports.formatZodError = exports.getCountryIdWithSuperAdminWithCountryData = exports.getCountryIdWithSuperAdmin = exports.getCountryId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const fs_2 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const product_service_1 = __importDefault(require("../services/admin/ecommerce/product-service"));
const country_model_1 = __importDefault(require("../model/admin/setup/country-model"));
function getCountryId(userData) {
    if (userData && userData.userTypeID && userData.countryId) {
        if (userData.userTypeID.slug !== 'super-admin') {
            return new mongoose_1.default.Types.ObjectId(userData.countryId);
        }
    }
    return undefined;
}
exports.getCountryId = getCountryId;
async function getCountryIdWithSuperAdmin(userData) {
    if (userData && userData.userTypeID && userData.countryId) {
        if (userData.userTypeID.slug !== 'super-admin') {
            return new mongoose_1.default.Types.ObjectId(userData.countryId);
        }
        else if (userData.userTypeID.slug === 'super-admin') {
            const countryId = await country_model_1.default.findOne({ isOrigin: true });
            return countryId._id;
        }
    }
    return undefined;
}
exports.getCountryIdWithSuperAdmin = getCountryIdWithSuperAdmin;
function getCountryIdWithSuperAdminWithCountryData(userData, countries) {
    if (userData && userData.userTypeID && userData.countryId) {
        if (userData.userTypeID.slug !== 'super-admin') {
            return new mongoose_1.default.Types.ObjectId(userData.countryId);
        }
        else if (userData.userTypeID.slug === 'super-admin') {
            return countries.find((country) => country.isOrigin === true)?._id;
        }
    }
    return undefined;
}
exports.getCountryIdWithSuperAdminWithCountryData = getCountryIdWithSuperAdminWithCountryData;
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
            return `/public/uploads/${folderPath}/${file.filename}`;
        }
        else {
            return data[fieldName];
        }
    }
    else {
        if (file) {
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
const categorySlugify = (text) => {
    return text.toLowerCase()
        .replace(/[(){}\[\]]/g, '_') // Replace (), [], {} with underscores
        .replace(/[^\w\s-]/g, '') // Remove remaining special characters except spaces and hyphens
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_+/g, '_') // Replace multiple underscores with a single underscore
        .replace(/_+$/, ''); // Remove trailing underscores
    // .replace(/-/g, '_')                // Replace hyphens with underscores
};
exports.categorySlugify = categorySlugify;
const categorySlugifyManually = (text) => {
    return text.toLowerCase()
        .replace(/[&(){}\[\]]/g, '_') // Replace &, (), [], {} with underscores
        .replace(/[^\w\s-]/g, '') // Remove remaining special characters except spaces and hyphens
        .replace(/[\s-]+/g, '_') // Replace spaces and hyphens with underscores
        .replace(/_+/g, '_') // Replace multiple underscores with a single underscore
        .replace(/^_+|_+$/g, ''); // Remove leading and trailing underscores
};
exports.categorySlugifyManually = categorySlugifyManually;
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
function generateOTP(length) {
    if (length <= 0) {
        throw new Error('Length must be a positive integer.');
    }
    let otp = '';
    for (let i = 0; i < length; i++) {
        const digit = Math.floor(Math.random() * 10); // Generate a random digit between 0 and 9
        otp += digit.toString();
    }
    return otp;
}
exports.generateOTP = generateOTP;
function calculateWalletAmount(earnPoints, referAndEarn) {
    const earnAmount = parseFloat(referAndEarn.earnAmount);
    const earnPointsForAmount = parseFloat(referAndEarn.earnPoints);
    // Calculate the walletAmount
    const walletAmount = (earnPoints / earnPointsForAmount) * earnAmount;
    return walletAmount;
}
exports.calculateWalletAmount = calculateWalletAmount;
const capitalizeWords = (sentence) => {
    if (!sentence)
        return "";
    return sentence.replace(/(\b\w|'\w)/g, (match) => {
        if (match.startsWith("'")) {
            return match.charAt(0) + match.charAt(1).toLowerCase();
        }
        else {
            return match.charAt(0).toUpperCase();
        }
    });
};
exports.capitalizeWords = capitalizeWords;
const uploadImageFromUrl = async (imageUrl) => {
    try {
        // Determine if the URL is HTTP or HTTPS
        const protocol = imageUrl.startsWith('https') ? https_1.default : http_1.default;
        // Use the URL module to parse the imageUrl
        const parsedUrl = new URL(imageUrl);
        // Extract the filename from the URL or generate a unique filename
        let filename = path_1.default.basename(parsedUrl.pathname);
        if (!filename || filename === '/') {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            filename = `productImage - ${uniqueSuffix}.jpg`; // Example: Use .jpg as extension
        }
        // Define the path where the image will be saved
        const outputPath = path_1.default.join(__dirname, '../../public/uploads/product/', filename);
        // Ensure the directory exists
        fs_2.default.mkdirSync(path_1.default.dirname(outputPath), { recursive: true });
        // Create a writable stream to save the image
        const writer = fs_2.default.createWriteStream(outputPath);
        // Set a timeout for the HTTP/HTTPS request
        const timeout = 10000; // 10 seconds
        // Make the HTTP/HTTPS GET request to the image URL
        const response = await new Promise((resolve, reject) => {
            const req = protocol.get(imageUrl, { timeout }, (res) => {
                // Check for non-200 status codes
                if (res.statusCode !== 200) {
                    reject(new Error(`Failed to get '${imageUrl}'(${res.statusCode})`));
                    return;
                }
                res.pipe(writer);
                writer.on('finish', () => resolve(filename));
                writer.on('error', (err) => reject(new Error(`Writer error: ${err.message}`)));
            });
            req.on('error', (err) => reject(new Error(`Request error: ${err.message}`)));
            // Handle request timeout
            req.on('timeout', () => {
                req.abort();
                reject(new Error('Request timed out'));
            });
        });
        return response; // Return the filename when download completes
    }
    catch (error) {
        console.error('Error downloading image:', error.message);
        return null; // Return null if there's an error
    }
};
exports.uploadImageFromUrl = uploadImageFromUrl;
const calculateTotalDiscountAmountDifference = (totalAmount, discountType, discountVal) => {
    let discountAmount;
    if (discountType === 'amount' || discountType === 'amount-off') {
        discountAmount = discountVal;
    }
    else if (discountType === 'percent' || discountType === 'percentage') {
        discountAmount = (discountVal / 100) * totalAmount;
    }
    else {
        discountAmount = 0;
    }
    return discountAmount;
};
exports.calculateTotalDiscountAmountDifference = calculateTotalDiscountAmountDifference;
function calculateWalletRewardPoints(wallet, totalOrderAmount) {
    if (!wallet || totalOrderAmount === undefined || totalOrderAmount === null) {
        return { rewardPoints: 0, redeemableAmount: 0 };
    }
    const redeemAmount = Number(wallet.redeemAmount);
    const redeemPoints = Number(wallet.redeemPoints);
    const orderAmount = Number(wallet.orderAmount);
    const minimumOrderAmount = Number(wallet.minimumOrderAmount);
    if (isNaN(redeemAmount) || isNaN(redeemPoints) || isNaN(orderAmount) || isNaN(minimumOrderAmount) || redeemAmount <= 0 || redeemPoints <= 0 || totalOrderAmount < minimumOrderAmount) {
        console.log('Invalid input values or totalOrderAmount is less than minimumOrderAmount');
        return { rewardPoints: 0, redeemableAmount: 0 };
    }
    let rewardPoints = 0;
    let redeemableAmount = 0;
    if (wallet.walletType === 'flat') {
        rewardPoints = (totalOrderAmount / orderAmount) * redeemPoints;
        redeemableAmount = (totalOrderAmount / orderAmount) * redeemAmount;
    }
    else if (wallet.walletType === 'percent') {
        redeemableAmount = (totalOrderAmount * redeemAmount) / 100;
        rewardPoints = (redeemableAmount * redeemPoints) / redeemAmount;
    }
    return { rewardPoints: Math.floor(rewardPoints), redeemableAmount: Number(redeemableAmount?.toFixed(2)) };
}
exports.calculateWalletRewardPoints = calculateWalletRewardPoints;
const calculateExpectedDeliveryDate = (orderStatusAt, commonDeliveryDays) => {
    const orderDate = new Date(orderStatusAt);
    const expectedDeliveryDate = new Date(orderDate);
    expectedDeliveryDate.setDate(orderDate.getDate() + commonDeliveryDays);
    const year = expectedDeliveryDate.getFullYear();
    const month = String(expectedDeliveryDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(expectedDeliveryDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
exports.calculateExpectedDeliveryDate = calculateExpectedDeliveryDate;
const normalizeWord = (word) => {
    return word.replace(/ - [A-Z0-9-]+$/, '').trim();
};
exports.normalizeWord = normalizeWord;
const truncateWord = (word, maxWords) => {
    const words = word.split(' ');
    if (words.length > maxWords) {
        return words.slice(0, maxWords).join(' ') + '...';
    }
    return word;
};
exports.truncateWord = truncateWord;
const formatAmount = (amount) => {
    return amount !== undefined && amount !== null
        ? parseFloat(amount).toFixed(2)
        : "0.00";
};
exports.formatAmount = formatAmount;
const roundToTwo = (num) => Math.round(num * 100) / 100;
exports.roundToTwo = roundToTwo;
