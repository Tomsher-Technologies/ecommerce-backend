"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const customers_model_1 = __importDefault(require("../../src/model/frontend/customers-model"));
const frontendAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ message: 'Unauthorized - Missing Authorization header', status: false });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized - Missing token', status: false });
        }
        const checkToken = jsonwebtoken_1.default.verify(token, `${process.env.TOKEN_SECRET_KEY}`);
        if (checkToken?.userId) {
            const userData = await customers_model_1.default.findOne({ _id: checkToken.userId });
            if (userData) {
                req.user = userData;
                res.locals.user = userData;
                next();
            }
            else {
                return res.status(404).json({ message: 'User data not found!', status: false });
            }
        }
        else {
            return res.status(401).json({ message: 'Unauthorized - Invalid token', status: false, reLogin: true });
        }
    }
    catch (error) {
        console.error(error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(400).json({ message: 'Invalid token', status: false });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.default = frontendAuthMiddleware;
