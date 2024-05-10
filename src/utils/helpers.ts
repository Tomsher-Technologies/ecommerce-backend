import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { ZodError } from 'zod';
import { access, constants } from 'fs';
import { Request } from 'express';
import fs from 'fs';
import ProductsService from '../services/admin/ecommerce/products-service';


type ZodValidationError = {
    path: (string | number)[];
    message: string;
};


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
            console.log('herere',data);
            
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


export const uploadGallaryImages = async (req: Request, productID: string, galleryImages: any[]): Promise<void> => {
    try {
        await Promise.all(galleryImages.map(async (galleryImage) => {
            const galleryImageData = {
                productID: productID,
                galleryImageUrl: handleFileUpload(req, null, galleryImage, 'galleryImageUrl', 'product'),
                status: '1'
            };
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

export const slugify = (text: string): string => {
    return text.toLowerCase().replace(/[^\w\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
        .trim(); // Trim leading and trailing spaces
};
export const categorySlugify = (text: string): string => {
    return text.toLowerCase().replace(/[^\w\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
        .replace(/\s+/g, '_') // Replace spaces with hyphens
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