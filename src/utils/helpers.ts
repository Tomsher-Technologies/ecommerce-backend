import mongoose from 'mongoose';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { ZodError } from 'zod';
import { Request } from 'express';
import fs from 'fs';

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
            console.log('${req.protocol}://${req.hostname}/${file.path}`', file);

            // return `${file.path}`; // Construct the URL using req.protocol and req.hostname
            return `/public/uploads/${folderPath}/${file.filename}`;
        } else {
            return data[fieldName];
        }
    } else {
        if (file) {
            // console.log('file',file.filename);
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