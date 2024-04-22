import multer from 'multer';
import path from 'path';
import fs from 'fs';

interface MulterConfig {
    storage: multer.StorageEngine;
    upload: multer.Multer;
}

const configureMulter = (folderPath: string, fieldNames: string[]): MulterConfig => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          
            const uploadDir = path.join(__dirname, '..', '..', `public/uploads/${folderPath}`);
            // Create the uploads directory if it doesn't exist
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir);
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        }
    });

    const upload = multer({ storage: storage });

    return { storage, upload };
}

export { configureMulter };
