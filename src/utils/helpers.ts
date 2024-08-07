import mongoose from 'mongoose';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { ZodError } from 'zod';
import { Request } from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';

import ProductsService from '../services/admin/ecommerce/product-service';
import CountryModel from '../model/admin/setup/country-model';

type ZodValidationError = {
    path: (string | number)[];
    message: string;
};


export function getCountryId(userData: any): mongoose.Types.ObjectId | undefined {
    if (userData && userData.userTypeID && userData.countryId) {
        if (userData.userTypeID.slug !== 'super-admin') {
            return new mongoose.Types.ObjectId(userData.countryId);
        }
    }
    return undefined;
}

export async function getCountryIdWithSuperAdmin(userData: any): Promise<mongoose.Types.ObjectId | undefined> {

    if (userData && userData.userTypeID && userData.countryId) {
        if (userData.userTypeID.slug !== 'super-admin') {
            return new mongoose.Types.ObjectId(userData.countryId);
        } else if (userData.userTypeID.slug === 'super-admin') {
            const countryId: any = await CountryModel.findOne({ isOrigin: true })

            return countryId._id
        }
    }
    return undefined;
}

export const formatZodError = (errors: ZodError['errors']): Record<string, string> => {
    const formattedErrors: Record<string, string> = {};
    errors.forEach((err: ZodValidationError) => {
        const path = err.path.join('.');
        formattedErrors[path] = err.message;
    });

    return formattedErrors;
};


export const handleFileUpload = (req: any, data: any, file: any, fieldName: string, folderPath: string) => {

    if (data && data[fieldName]) {
        if (file) {
            deleteImage(data, fieldName);
            return `/public/uploads/${folderPath}/${file.filename}`;
        } else {
            return data[fieldName];
        }
    } else {
        if (file) {
            return `/public/uploads/${folderPath}/${file.filename}`; // Construct the URL using req.protocol and req.hostname
        } else {
            return null;
        }
    }
}


export const deleteImage = (data: any, fieldName: string) => {
    if (data && data[fieldName]) {
        const filePath = data[fieldName];
        if (existsSync(filePath)) { // Check if the file exists before attempting deletion
            try {
                unlink(filePath);
                console.log("Old file deleted successfully:", filePath);
            } catch (error) {
                console.error("Error deleting old file:", error);
            }
        } else {
            console.warn("File not found:", filePath);
        }
    } else {
        console.warn("Field not found in data object or data object is empty.");
    }
};

export const deleteFile = (filePath: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                reject(err);
            } else {
                console.log('File deleted successfully:', filePath);
                resolve();
            }
        });
    });
};


export const uploadGallaryImages = async (req: Request, Id: any, galleryImages: any[]): Promise<void> => {
    try {
        await Promise.all(galleryImages.map(async (galleryImage) => {
            var galleryImageData
            if (Id.variantId) {
                galleryImageData = {
                    variantId: Id.variantId,
                    galleryImageUrl: handleFileUpload(req, null, galleryImage, 'galleryImageUrl', 'product'),
                    status: '1'
                };
            } else {
                galleryImageData = {
                    productID: Id,
                    galleryImageUrl: handleFileUpload(req, null, galleryImage, 'galleryImageUrl', 'product'),
                    status: '1'
                };
            }
            await ProductsService.createGalleryImages(galleryImageData);
        }));
    } catch (error) {
        console.log('errorerrorerror', error);
        // Handle errors
    }
};

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

export const slugify = (text: string, slugDiff = '-'): string => {
    return text.toLowerCase().replace(/[^\w\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
        .replace(/\s+/g, slugDiff) // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
        .trim(); // Trim leading and trailing spaces
};

export const categorySlugify = (text: string): string => {
    return text.toLowerCase()
        .replace(/[(){}\[\]]/g, '_')  // Replace (), [], {} with underscores
        .replace(/[^\w\s-]/g, '')      // Remove remaining special characters except spaces and hyphens
        .replace(/\s+/g, '_')          // Replace spaces with underscores
        .replace(/_+/g, '_')           // Replace multiple underscores with a single underscore
        .replace(/_+$/, '');           // Remove trailing underscores
                // .replace(/-/g, '_')                // Replace hyphens with underscores

};

export const categorySlugifyManually = (text: string): string => {
    return text.toLowerCase()
        .replace(/[&(){}\[\]]/g, '_')  // Replace &, (), [], {} with underscores
        .replace(/[^\w\s-]/g, '')      // Remove remaining special characters except spaces and hyphens
        .replace(/[\s-]+/g, '_')       // Replace spaces and hyphens with underscores
        .replace(/_+/g, '_')           // Replace multiple underscores with a single underscore
        .replace(/^_+|_+$/g, '');      // Remove leading and trailing underscores
};

export const isValidPriceFormat = (value: string): boolean => {
    const priceRegex = /^\d+(\.\d{1,2})?$/;
    return priceRegex.test(value);
};

export const stringToArray = (input: string): string[] => {
    if (input) {
        const trimmedInput = input.trim();
        const arrayResult = trimmedInput.split(',');
        const trimmedArray = arrayResult.map(item => item.trim());
        return trimmedArray;
    } else {
        return [];
    }
};


export const getIndexFromFieldName = (fieldname: string, keyValue: string): number => {
    const match = fieldname?.match(new RegExp(`${keyValue}\\[(\\d+)\\]`));
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    return -1;
}

export const checkValueExists = <T extends object>(obj: T, value: T[keyof T]): boolean => {
    return Object.values(obj).includes(value);
};

export const dateConvertPm = (input: string): Date => {
    return new Date(`${input}T23:59:59.999Z`)
};

export function generateOTP(length: number): string {
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

export function calculateWalletAmount(earnPoints: number, referAndEarn: any) {
    const earnAmount = parseFloat(referAndEarn.earnAmount);
    const earnPointsForAmount = parseFloat(referAndEarn.earnPoints);

    // Calculate the walletAmount
    const walletAmount = (earnPoints / earnPointsForAmount) * earnAmount;

    return walletAmount;
}


export const capitalizeWords = (sentence: string): string => {
    if (!sentence) return ""; 

    return sentence.replace(/(\b\w|'\w)/g, (match) => {
        if (match.startsWith("'")) {
            return match.charAt(0) + match.charAt(1).toLowerCase();
        } else {
            return match.charAt(0).toUpperCase();
        }
    });
};

export const uploadImageFromUrl = async (imageUrl: any) => {
    try {
        // Determine if the URL is HTTP or HTTPS
        const protocol = imageUrl.startsWith('https') ? https : http;

        // Use the URL module to parse the imageUrl
        const parsedUrl = new URL(imageUrl);

        // Extract the filename from the URL or generate a unique filename
        let filename: any = path.basename(parsedUrl.pathname);
        if (!filename || filename === '/') {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            filename = `productImage - ${uniqueSuffix}.jpg`; // Example: Use .jpg as extension
        }

        // Define the path where the image will be saved
        const outputPath = path.join(__dirname, '../../public/uploads/product/', filename);

        // Ensure the directory exists
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });

        // Create a writable stream to save the image
        const writer = fs.createWriteStream(outputPath);

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
    } catch (error: any) {
        console.error('Error downloading image:', error.message);
        return null; // Return null if there's an error
    }
};

export type DiscountType = 'amount' | 'percentage' | 'percent' | 'amount-off';

export const calculateTotalDiscountAmountDifference = (
    totalAmount: number,
    discountType: DiscountType,
    discountVal: number
): number => {
    let discountAmount: number;

    if (discountType === 'amount' || discountType === 'amount-off') {
        discountAmount = discountVal;
    } else if (discountType === 'percent' || discountType === 'percentage') {
        discountAmount = (discountVal / 100) * totalAmount;
    } else {
        discountAmount = 0;
    }

    return discountAmount;
};

type Wallet = {
    redeemAmount: string;
    redeemPoints: string;
    orderAmount: string;
    walletType: string;
    minimumOrderAmount: string;
    minimumOrderRedeemAtTime: string;
};


export function calculateWalletRewardPoints(wallet: Wallet, totalOrderAmount: number) {
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
    } else if (wallet.walletType === 'percent') {
        redeemableAmount = (totalOrderAmount * redeemAmount) / 100;
        rewardPoints = (redeemableAmount * redeemPoints) / redeemAmount;
    }

    return { rewardPoints: Math.floor(rewardPoints), redeemableAmount: Number(redeemableAmount?.toFixed(2)) };
}

export const calculateExpectedDeliveryDate = (orderStatusAt: string, commonDeliveryDays: number): string => {
    const orderDate = new Date(orderStatusAt);
    const expectedDeliveryDate = new Date(orderDate);

    expectedDeliveryDate.setDate(orderDate.getDate() + commonDeliveryDays);

    const year = expectedDeliveryDate.getFullYear();
    const month = String(expectedDeliveryDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(expectedDeliveryDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};
