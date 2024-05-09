
import MultiLanguageFieledsModel, { MultiLanguageFieledsProps } from "../../model/admin/multi-language-fieleds-model";
import AdminTaskLogModel from "../../model/admin/task-log";

const Address6 = require('ip-address').Address6;
const address = new Address6('2001:0:ce49:7601:e866:efff:62c3:fffe');
const ipAddress = address.inspectTeredo();
export interface AdminTaskLogProps {
    sourceFromId: string;
    sourceFrom: string;
    userId?: string;
    activity: string;
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

    async taskLog(taskLogs: AdminTaskLogProps) {
        if (taskLogs.sourceFromId && taskLogs.userId && taskLogs.sourceFrom && taskLogs.activity && taskLogs.activityStatus) {
            const taskLogData = {
                userId: taskLogs.userId,
                sourceFromId: taskLogs.sourceFromId,
                sourceFrom: taskLogs.sourceFrom,
                activity: taskLogs.activity,
                activityStatus: taskLogs.activityStatus,
                ipAddress: ipAddress.client4,
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
}

export default new GeneralService();