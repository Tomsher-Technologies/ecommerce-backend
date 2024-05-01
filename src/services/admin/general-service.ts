
import MultiLanguageFieledsModel, { MultiLanguageFieledsProps } from "@model/admin/multi-language-fieleds-model";


class GeneralService {

    async findOneLanguageValues(source: string, sourceId: string) {
        try {
            const languageValues: any = await MultiLanguageFieledsModel.findOne({
                source: source,
                sourceId: sourceId
            });

            return languageValues || [];
        } catch (error: any) {
            throw new Error('Error occurred while changing slider position: ' + error.message);
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
                    const isEmptyValue = Object.values(languageValues.languageValues).some(value => value !== '');
                    
                    console.log('isEmptyValue', isEmptyValue);
                    if (isEmptyValue) {
                        const multiLanguageData = {
                            languageId: languageValues.languageId,
                            sourceId: sourceId,
                            source: languageValues.source,
                            languageTitle: languageValues.languageTitle,
                            languageValues: languageValues.languageValues,
                            createdAt: new Date()
                        };
                        console.log('multiLanguageData', multiLanguageData);

                        managedLanguageValue = await MultiLanguageFieledsModel.create(multiLanguageData);
                    }
                }
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