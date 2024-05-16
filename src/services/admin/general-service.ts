import MultiLanguageFieledsModel, { MultiLanguageFieledsProps } from "../../model/admin/multi-language-fieleds-model";
import AdminTaskLogModel from "../../model/admin/task-log";

const os = require('os');
// Get network interfaces
const networkInterfaces = os.networkInterfaces();

// Iterate through each network interface

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
            var ip
            Object.keys(networkInterfaces).forEach(interfaceName => {
                const interfaceDetails = networkInterfaces[interfaceName];
                interfaceDetails.forEach((interfaceInfo: any) => {
                    // Check if it's an IPv4 address and not internal
                    if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
                        ip = interfaceInfo.address
                    }
                });
            });
            const taskLogData = {
                userId: taskLogs.userId,
                sourceFromId: taskLogs.sourceFromId,
                sourceFrom: taskLogs.sourceFrom,
                activity: taskLogs.activity,
                activityStatus: taskLogs.activityStatus,
                ipAddress: ip,
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
        if ((deleteModel) && (deleteModel.length > 0)) {
            for (const deleteKey of deleteModel) {
                const { model, ...deleteKeyIds } = deleteKey;

                try {
                    const deletedKeyValue = Object.keys(deleteKeyIds)[0];
                    const deletedKeyId = Object.values(deleteKeyIds)[0];

                    if ((deletedKeyValue) && (deletedKeyId)) {
                        await model.deleteMany({ [deletedKeyValue]: deletedKeyId })
                    }
                } catch (error) {
                    console.error(`Error deleting document from ${model.modelName}:`, error);
                }
            }
        }
    }
}

export default new GeneralService();