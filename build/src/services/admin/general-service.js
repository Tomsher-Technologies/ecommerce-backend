"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const multi_language_fieleds_model_1 = __importDefault(require("../../model/admin/multi-language-fieleds-model"));
const task_log_1 = __importDefault(require("../../model/admin/task-log"));
const pagination_1 = require("../../components/pagination");
const collections_1 = require("../../constants/collections");
class GeneralService {
    async findOneLanguageValues(source, sourceId, languageId) {
        try {
            let query = {
                source: source,
                sourceId: sourceId
            };
            if (languageId) {
                query.languageId = languageId;
            }
            const languageValues = await multi_language_fieleds_model_1.default.findOne(query);
            return languageValues || [];
        }
        catch (error) {
            throw new Error('Error occurred while changing slider position: ' + error.message);
        }
    }
    async getVisitorIP() {
        try {
            const networkInterfaces = os_1.default.networkInterfaces();
            const ipv4 = Object.values(networkInterfaces)
                .flat()
                .filter(iface => iface && iface.family === 'IPv4' && !iface.internal)
                .map(iface => iface && iface.address);
            //     const response = await fetch('https://api64.ipify.org?format=json');
            //     const data = await response.json();
            //     console.log("data:");
            return ipv4[0];
        }
        catch (error) {
            console.error('Error fetching IP address:', error);
            return null;
        }
    }
    async getCountryFromIP(ipAddress) {
        try {
            const response = await fetch(`https://ipapi.co/${ipAddress}/country/`);
            const country = await response.text();
            return country;
        }
        catch (error) {
            console.error('Error fetching country from IP:', error);
            return null;
        }
    }
    async getAlltaskLogs(options = {}) {
        const { query, skip, limit, sort } = (0, pagination_1.pagination)(options.query || {}, options);
        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }
        let pipeline = [
            {
                $facet: {
                    taskLogs: [
                        { $match: query },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: `${collections_1.collections.account.users}`,
                                localField: 'userId',
                                foreignField: '_id',
                                as: 'user'
                            }
                        },
                        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                        { $sort: finalSort }
                    ],
                    sourceFromValues: [
                        {
                            $group: {
                                _id: null,
                                sourceFromArray: { $addToSet: "$sourceFrom" }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                sourceFromArray: 1
                            }
                        }
                    ],
                    totalCount: [
                        { $match: query },
                        { $count: "count" }
                    ]
                }
            },
            {
                $project: {
                    taskLogs: {
                        _id: 1,
                        countryId: 1,
                        userId: 1,
                        taskCode: 1,
                        sourceCollection: 1,
                        sourceFrom: 1,
                        sourceFromId: 1,
                        sourceFromReferenceId: 1,
                        referenceData: 1,
                        activity: 1,
                        activityComment: 1,
                        activityStatus: 1,
                        ipAddress: 1,
                        createdAt: 1,
                        user: {
                            _id: 1,
                            countryId: 1,
                            email: 1,
                            firstName: 1,
                            lastName: 1,
                            phone: 1,
                        }
                    },
                    sourceFromArray: { $arrayElemAt: ["$sourceFromValues.sourceFromArray", 0] },
                    totalCount: { $arrayElemAt: ["$totalCount.count", 0] }
                }
            }
        ];
        const result = await task_log_1.default.aggregate(pipeline).exec();
        return {
            taskLogs: result[0].taskLogs,
            sourceFromArray: result[0].sourceFromArray || [],
            totalCount: result[0].totalCount || 0
        };
    }
    async taskLog(taskLogs) {
        if (taskLogs.userId && taskLogs.sourceFrom && taskLogs.activity && taskLogs.activityStatus) {
            const taskLogData = {
                userId: taskLogs.userId,
                sourceFromId: taskLogs.sourceFromId || null,
                sourceFromReferenceId: taskLogs.sourceFromReferenceId || null,
                countryId: taskLogs.countryId || null,
                sourceCollection: taskLogs.sourceCollection,
                referenceData: taskLogs.referenceData,
                sourceFrom: taskLogs.sourceFrom,
                activity: taskLogs.activity,
                activityComment: taskLogs.activityComment || '',
                activityStatus: taskLogs.activityStatus,
                ipAddress: await this.getVisitorIP(),
                createdAt: new Date()
            };
            await task_log_1.default.create(taskLogData);
            return true;
        }
        else {
            return false;
        }
    }
    async multiLanguageFieledsManage(sourceId, languageValues) {
        if (sourceId && languageValues.languageId && languageValues.source) {
            const existingEntries = await multi_language_fieleds_model_1.default.findOne({
                languageId: languageValues.languageId,
                source: languageValues.source,
                sourceId: sourceId
            });
            let managedLanguageValue = {};
            if (existingEntries) {
                const filter = {
                    languageId: languageValues.languageId,
                    source: languageValues.source,
                    sourceId: sourceId
                };
                const update = {
                    $set: {
                        languageValues: languageValues.languageValues,
                        languageId: languageValues.languageId
                    }
                };
                const options = {
                    upsert: false,
                    new: true
                };
                managedLanguageValue = await multi_language_fieleds_model_1.default.findOneAndUpdate(filter, update, options);
                return managedLanguageValue;
            }
            else {
                if (languageValues.languageValues) {
                    const isEmptyValue = Object.values(languageValues.languageValues).some(value => (value !== ''));
                    if (isEmptyValue) {
                        const multiLanguageData = {
                            languageId: languageValues.languageId,
                            sourceId: sourceId,
                            source: languageValues.source,
                            languageTitle: languageValues.languageTitle,
                            languageValues: languageValues.languageValues,
                            createdAt: new Date()
                        };
                        managedLanguageValue = await multi_language_fieleds_model_1.default.create(multiLanguageData);
                    }
                }
                // console.log('managedLanguageValuemanagedLanguageValue', managedLanguageValue);
                return { languageValues: { ...managedLanguageValue } };
            }
        }
        else {
            return { languageValues: {} };
        }
    }
    async destroyLanguageValues(multiLanguageId) {
        return multi_language_fieleds_model_1.default.findOneAndDelete({ _id: multiLanguageId });
    }
    async changePosition(model, serviceId, newPosition) {
        try {
            const serviceToUpdateData = await model.findById(serviceId);
            if (!serviceToUpdateData) {
                return null; // Slider not found
            }
            const servicesToUpdate = await model.find({ position: { $gte: newPosition } });
            for (const slider of servicesToUpdate) {
                if (slider._id.toString() !== serviceId) {
                    await model.updateOne({ _id: slider._id }, { position: slider.position + 1 });
                }
            }
            serviceToUpdateData.position = newPosition;
            const updatedService = await model.findByIdAndUpdate(serviceId, { position: newPosition }, { new: true, useFindAndModify: false });
            return updatedService;
        }
        catch (error) {
            throw new Error('Error occurred while changing slider position: ' + error.message);
        }
    }
    async deleteParentModel(deleteModel) {
        if ((deleteModel) && (deleteModel?.length > 0)) {
            for (const deleteKey of deleteModel) {
                const { model, ...deleteKeyIds } = deleteKey;
                try {
                    const deletedKeyValue = Object.keys(deleteKeyIds)[0];
                    const deletedKeyId = Object.values(deleteKeyIds)[0];
                    if ((deletedKeyValue) && (deletedKeyId)) {
                        const findDeletedData = await model.find({ [deletedKeyValue]: deletedKeyId });
                        if (findDeletedData) {
                            await model.deleteMany({ [deletedKeyValue]: deletedKeyId });
                        }
                    }
                }
                catch (error) {
                    console.error(`Error deleting document from ${model.modelName}:`, error);
                }
            }
        }
    }
}
exports.default = new GeneralService();
