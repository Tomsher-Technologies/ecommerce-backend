"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const general_service_1 = __importDefault(require("../../../services/admin/general-service"));
const mongoose_1 = __importDefault(require("mongoose"));
const helpers_1 = require("../../../utils/helpers");
const task_log_1 = require("../../../constants/admin/task-log");
const controller = new base_controller_1.default();
class TaskLogController extends base_controller_1.default {
    async findAllTaskLogs(req, res) {
        try {
            const { countryId = '', userId = '', sourceFromId = '', sourceFromReferenceId = '', sourceFrom = '', activityStatus = '', sourceCollection = '', activity = '', page_size = 1, limit = 10, sortby = '', sortorder = '', keyword = '', _id = '' } = req.query;
            let query = { _id: { $exists: true } };
            const userData = await res.locals.user;
            const country = (0, helpers_1.getCountryId)(userData);
            if (country) {
                query.countryId = country;
            }
            else if (countryId) {
                query.countryId = new mongoose_1.default.Types.ObjectId(countryId);
            }
            if (_id) {
                query = {
                    ...query, _id: new mongoose_1.default.Types.ObjectId(_id)
                };
            }
            if (sourceFromId) {
                query = {
                    ...query, sourceFromId: new mongoose_1.default.Types.ObjectId(sourceFromId)
                };
            }
            if (userId) {
                query = {
                    ...query, userId: new mongoose_1.default.Types.ObjectId(userId)
                };
            }
            if (sourceFromReferenceId) {
                query = {
                    ...query, sourceFromReferenceId: new mongoose_1.default.Types.ObjectId(sourceFromReferenceId)
                };
            }
            if (sourceFrom) {
                query = {
                    ...query, sourceFrom: sourceFrom.toString()
                };
            }
            if (activityStatus) {
                query = {
                    ...query, activityStatus: activityStatus.toString()
                };
            }
            if (activity) {
                query = {
                    ...query, activity: activity.toString()
                };
            }
            if (sourceCollection) {
                query = {
                    ...query, sourceCollection: sourceCollection.toString()
                };
            }
            const sort = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }
            const taskLog = await general_service_1.default.getAlltaskLogs({
                page: parseInt(page_size),
                limit: parseInt(limit),
                query,
                sort
            });
            const { totalCount, ...restData } = taskLog;
            return controller.sendSuccessResponse(res, {
                requestedData: {
                    ...restData,
                    adminTaskLogActivity: task_log_1.adminTaskLogActivity,
                    adminTaskLogStatus: task_log_1.adminTaskLogStatus
                },
                totalCount
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching countries' });
        }
    }
}
exports.default = new TaskLogController();
