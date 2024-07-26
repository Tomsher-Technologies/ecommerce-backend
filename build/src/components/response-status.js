"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.logResponseStatus = void 0;
const multer_1 = __importDefault(require("multer"));
const mongoose_1 = __importDefault(require("mongoose"));
const logResponseStatus = async (req, res, next) => {
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
exports.logResponseStatus = logResponseStatus;
const errorMiddleware = (err, req, res, next) => {
    console.error(err.stack); // Log the error stack to check if the middleware is being invoked
    if (err instanceof multer_1.default.MulterError) {
        console.error('Multer Error:', err);
        return res.status(400).send('File upload error: ' + err.message);
    }
    else if (err.name === 'ValidationError' && err.errors && Object.keys(err.errors).length > 0) {
        // If the error is a Mongoose validation error and contains errors
        const errorMessages = Object.values(err.errors).map((error) => error.message);
        return res.status(400).send(errorMessages.join(', '));
    }
    else if (err.message.startsWith('Products validation failed:')) {
        // If the error message starts with 'Products validation failed:'
        const errorMessage = err.message.replace('Products validation failed:', '').trim();
        return res.status(400).send(errorMessage);
    }
    else {
        return res.status(500).send('Something broke!');
    }
};
exports.errorMiddleware = errorMiddleware;
function validateObjectId(req, res, next) {
    const id = req.params.id;
    if (mongoose_1.default.Types.ObjectId.isValid(id)) {
        next();
    }
    else {
        next('route');
    }
}
exports.default = validateObjectId;
