import { Response } from 'express';
import { unlink } from 'fs/promises';

import GeneralService, { AdminTaskLogProps } from '@services/admin/general-service';

class BaseController {

    async sendSuccessResponse(res: Response, requestedData: any, status: number = 200, taskLog?: AdminTaskLogProps): Promise<any> {
        if (taskLog) {
            const user = res.locals.user;
            await GeneralService.taskLog({ ...taskLog, userId: user._id })
        }
        res.status(status).json({
            ...requestedData,
            status: true,
        });
    }

    async sendErrorResponse(res: Response, statusCode: number = 400, data: any, req?: any): Promise<any> {
        if ((req)) {
            if (req.file) {
                await unlink(req.file.path);
            } else if ((req) && (req.files?.length > 0)) {
                req.files.map(async (filePath: any) => {
                    if (filePath.path) {
                        await unlink(filePath.path);
                    }
                })
            }
        }

        return res.status(statusCode).json({
            ...data,
            error: 'error',
            status: false
        });
    }
}

export default BaseController;