"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const general_service_1 = __importDefault(require("../../services/admin/general-service"));
class BaseController {
    async sendSuccessResponse(res, requestedData, status = 200, taskLog) {
        if (taskLog) {
            const user = res.locals.user;
            await general_service_1.default.taskLog({ ...taskLog, userId: user._id });
        }
        res.status(status).json({
            ...requestedData,
            status: true,
        });
    }
    async sendErrorResponse(res, statusCode = 400, data, req) {
        if ((req)) {
            if (req.file) {
                await (0, promises_1.unlink)(req.file.path);
            }
            else if ((req) && (req.files?.length > 0)) {
                req.files.map(async (filePath) => {
                    if (filePath.path) {
                        await (0, promises_1.unlink)(filePath.path);
                    }
                });
            }
        }
        return res.status(statusCode).json({
            ...data,
            error: 'error',
            status: false
        });
    }
}
exports.default = BaseController;
