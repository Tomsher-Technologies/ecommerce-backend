import { Request, Response } from 'express';


import BaseController from '../../../controllers/admin/base-controller';
import GeneralService from '../../../services/admin/general-service';
import mongoose from 'mongoose';
import { QueryParams } from '../../../utils/types/common';
import { getCountryId } from '../../../utils/helpers';
import { adminTaskLogActivity, adminTaskLogStatus } from '../../../constants/admin/task-log';

const controller = new BaseController();

class TaskLogController extends BaseController {

    async findAllTaskLogs(req: Request, res: Response): Promise<void> {
        try {
            const { countryId = '', userId = '', sourceFromId = '', sourceFromReferenceId = '', sourceFrom = '', activityStatus = '', sourceCollection = '', activity = '', page_size = 1, limit = 10, sortby = '', sortorder = '', keyword = '', _id = '' } = req.query as QueryParams;
            let query: any = { _id: { $exists: true } };
            const userData = await res.locals.user;
            const country = getCountryId(userData);
            if (country) {
                query.countryId = country;
            } else if (countryId) {
                query.countryId = new mongoose.Types.ObjectId(countryId)
            }

            if (_id) {
                query = {
                    ...query, _id: new mongoose.Types.ObjectId(_id)
                } as any;
            }
            if (sourceFromId) {
                query = {
                    ...query, sourceFromId: new mongoose.Types.ObjectId(sourceFromId)
                } as any;
            }
            if (userId) {
                query = {
                    ...query, userId: new mongoose.Types.ObjectId(userId)
                } as any;
            }
            if (sourceFromReferenceId) {
                query = {
                    ...query, sourceFromReferenceId: new mongoose.Types.ObjectId(sourceFromReferenceId)
                } as any;
            }
            if (sourceFrom) {
                query = {
                    ...query, sourceFrom: sourceFrom.toString()
                } as any;
            }
            if (activityStatus) {
                query = {
                    ...query, activityStatus: activityStatus.toString()
                } as any;
            }
            if (activity) {
                query = {
                    ...query, activity: activity.toString()
                } as any;
            }
            if (sourceCollection) {
                query = {
                    ...query, sourceCollection: sourceCollection.toString()
                } as any;
            }

            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const taskLog: any = await GeneralService.getAlltaskLogs({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });
            const { totalCount, ...restData } = taskLog;
            return controller.sendSuccessResponse(res, {
                requestedData: {
                    ...restData,
                    adminTaskLogActivity,
                    adminTaskLogStatus
                },
                totalCount
            }, 200);
        } catch (error: any) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching countries' });
        }
    }

}

export default new TaskLogController();