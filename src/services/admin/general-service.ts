import os from 'os';

import MultiLanguageFieledsModel, { MultiLanguageFieledsProps } from "../../model/admin/multi-language-fieleds-model";
import AdminTaskLogModel from "../../model/admin/task-log";
import { FilterOptionsProps, pagination } from '../../components/pagination';
export interface AdminTaskLogProps {
    userId?: string;
    sourceFromId?: string | null;
    countryId?: string | null;
    sourceCollection?: string | null;
    sourceFromReferenceId?: string | null;
    sourceFrom: string;
    referenceData?: any;
    activity: string;
    activityComment?: string;
    activityStatus: string;
}
class GeneralService {

    async findOneLanguageValues(source: string, sourceId: string, languageId?: string) {
        try {
            let query: any = {
                source: source,
                sourceId: sourceId
            };

            if (languageId) {
                query.languageId = languageId;
            }

            const languageValues: any = await MultiLanguageFieledsModel.findOne(query);

            return languageValues || [];
        } catch (error: any) {
            throw new Error('Error occurred while changing slider position: ' + error.message);
        }
    }

    async getVisitorIP() {
        try {
            const networkInterfaces = os.networkInterfaces();
            const ipv4 = Object.values(networkInterfaces)
                .flat()
                .filter(iface => iface && iface.family === 'IPv4' && !iface.internal)
                .map(iface => iface && iface.address);

            //     const response = await fetch('https://api64.ipify.org?format=json');
            //     const data = await response.json();
            //     console.log("data:");
            return ipv4[0];
        } catch (error) {
            console.error('Error fetching IP address:', error);
            return null;
        }
    }

    async getCountryFromIP(ipAddress: any) {
        try {
            const response = await fetch(`https://ipapi.co/${ipAddress}/country/`);
            const country = await response.text();
            return country;
        } catch (error) {
            console.error('Error fetching country from IP:', error);
            return null;
        }
    }

    async getAlltaskLogs(options: FilterOptionsProps = {}): Promise<any[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            { $match: query },
            {
                $facet: {
                    taskLogs: [
                        { $skip: skip },
                        { $limit: limit },
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
                        { $count: "count" }
                    ]
                }
            },
            {
                $project: {
                    taskLogs: 1,
                    sourceFromArray: { $arrayElemAt: ["$sourceFromValues.sourceFromArray", 0] },
                    totalCount: { $arrayElemAt: ["$totalCount.count", 0] }
                }
            }
        ];

        const result: any = await AdminTaskLogModel.aggregate(pipeline).exec();
        return {
            taskLogs: result[0].taskLogs,
            sourceFromArray: result[0].sourceFromArray || [],
            totalCount: result[0].totalCount || 0
        } as any;
    }

    async taskLog(taskLogs: AdminTaskLogProps) {
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

            await AdminTaskLogModel.create(taskLogData);

            return true;
        } else {
            return false;
        }
    }


    async multiLanguageFieledsManage(sourceId: string, languageValues: any) {
        if (sourceId && languageValues.languageId && languageValues.source) {

            const existingEntries = await MultiLanguageFieledsModel.findOne({
                languageId: languageValues.languageId,
                source: languageValues.source,
                sourceId: sourceId
            });

            let managedLanguageValue: any = {};
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

                managedLanguageValue = await MultiLanguageFieledsModel.findOneAndUpdate(filter, update, options);
                return managedLanguageValue

            } else {
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

                        managedLanguageValue = await MultiLanguageFieledsModel.create(multiLanguageData);
                    }
                }
                // console.log('managedLanguageValuemanagedLanguageValue', managedLanguageValue);
                return { languageValues: { ...managedLanguageValue } };
            }
        } else {
            return { languageValues: {} };
        }
    }

    async destroyLanguageValues(multiLanguageId: string): Promise<MultiLanguageFieledsProps | null> {
        return MultiLanguageFieledsModel.findOneAndDelete({ _id: multiLanguageId });
    }

    async changePosition(model: any, serviceId: string, newPosition: number) {
        try {
            const serviceToUpdateData = await model.findById(serviceId);
            if (!serviceToUpdateData) {
                return null; // Slider not found
            }

            const servicesToUpdate = await model.find({ position: { $gte: newPosition } });

            for (const slider of servicesToUpdate) {
                if (slider._id.toString() !== serviceId) {
                    await model.updateOne(
                        { _id: slider._id },
                        { position: slider.position + 1 }
                    );
                }
            }

            serviceToUpdateData.position = newPosition;

            const updatedService = await model.findByIdAndUpdate(
                serviceId,
                { position: newPosition },
                { new: true, useFindAndModify: false }
            );

            return updatedService;
        } catch (error: any) {
            throw new Error('Error occurred while changing slider position: ' + error.message);
        }
    }
    async deleteParentModel(deleteModel: any) {
        if ((deleteModel) && (deleteModel?.length > 0)) {
            for (const deleteKey of deleteModel) {
                const { model, ...deleteKeyIds } = deleteKey;

                try {
                    const deletedKeyValue = Object.keys(deleteKeyIds)[0];
                    const deletedKeyId = Object.values(deleteKeyIds)[0];

                    if ((deletedKeyValue) && (deletedKeyId)) {
                        const findDeletedData = await model.find({ [deletedKeyValue]: deletedKeyId })
                        if (findDeletedData) {
                            await model.deleteMany({ [deletedKeyValue]: deletedKeyId })
                        }
                    }
                } catch (error) {
                    console.error(`Error deleting document from ${model.modelName}:`, error);
                }
            }
        }
    }
}

export default new GeneralService();