import { Request, Response, NextFunction } from 'express';
import { unlink } from 'fs/promises'; // Assuming you're using Node.js 14+
import multer from 'multer';

const logResponseStatus = async (req: Request, res: Response, next: NextFunction) => {
    res.on('finish', async () => {
        // console.error('Multer Error:', 'aaaaakmal');
        if (res.statusCode !== 200) {
            if (req.file) {
                // await unlink(req.file.path); // Delete uploaded file if response status is not 200
            }
        }
    });
    next();
};

const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack); // Log the error stack to check if the middleware is being invoked
    if (err instanceof multer.MulterError) {
        console.error('Multer Error:', err);
        return res.status(400).send('File upload error: ' + err.message);
    } else if (err.name === 'ValidationError' && err.errors && Object.keys(err.errors).length > 0) {
        // If the error is a Mongoose validation error and contains errors
        const errorMessages = Object.values(err.errors).map((error: any) => error.message);
        return res.status(400).send(errorMessages.join(', '));
    } else if (err.message.startsWith('Products validation failed:')) {
        // If the error message starts with 'Products validation failed:'
        const errorMessage = err.message.replace('Products validation failed:', '').trim();
        return res.status(400).send(errorMessage);
    } else {
        return res.status(500).send('Something broke!');
    }
};

export { logResponseStatus, errorMiddleware };
