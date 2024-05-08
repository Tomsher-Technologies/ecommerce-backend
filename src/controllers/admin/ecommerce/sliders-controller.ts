import 'module-alias/register';
import { Request, Response } from 'express';

import { formatZodError, handleFileUpload, slugify } from '@utils/helpers';
import { QueryParams } from '@utils/types/common';
import { sliderPositionSchema, sliderSchema, sliderStatusSchema } from '@utils/schemas/admin/ecommerce/slider-schema';
import { adminTaskLog, adminTaskLogActivity, adminTaskLogStatus } from '@constants/admin/task-log';

import BaseController from '@controllers/admin/base-controller';

import SliderService from '@services/admin/ecommerce/slider-service';
import GeneralService from '@services/admin/general-service';
import SliderModel from '@model/admin/ecommerce/slider-model';
import { multiLanguageSources } from '@constants/multi-languages';

const controller = new BaseController();

class SlidersController extends BaseController {

    async findAll(req: Request, res: Response): Promise<void> {
        try {
            const { page_size = 1, limit = 10, status = ['1', '2'], sortby = '', sortorder = '', keyword = '' } = req.query as QueryParams;
            let query: any = { _id: { $exists: true } };

            if (status && status !== '') {
                query.status = { $in: Array.isArray(status) ? status : [status] };
            } else {
                query.status = '1';
            }

            if (keyword) {
                const keywordRegex = new RegExp(keyword, 'i');
                query = {
                    $or: [
                        { sliderTitle: keywordRegex }
                    ],
                    ...query
                } as any;
            }
            const sort: any = {};
            if (sortby && sortorder) {
                sort[sortby] = sortorder === 'desc' ? -1 : 1;
            }

            const sliders = await SliderService.findAll({
                page: parseInt(page_size as string),
                limit: parseInt(limit as string),
                query,
                sort
            });

            return controller.sendSuccessResponse(res, {
                requestedData: sliders,
                totalCount: await SliderService.getTotalCount(query),
                message: 'Success!'
            }, 200);
        } catch (error: any) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching sliders' });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = sliderSchema.safeParse(req.body);

            if (validatedData.success) {
                const { countryId, sliderTitle, slug, page, linkType, link, position, description, status, languageValues } = validatedData.data;
                const user = res.locals.user;

                const sliderImage = (req as any).files.find((file: any) => file.fieldname === 'sliderImage');

                const sliderData = {
                    countryId,
                    sliderTitle,
                    slug: slug || slugify(sliderTitle),
                    page,
                    linkType,
                    link,
                    position,
                    sliderImageUrl: handleFileUpload(req, null, (req.file || sliderImage), 'sliderImageUrl', 'slider'),
                    description,
                    status: status || '1',
                    createdBy: user._id,
                    createdAt: new Date()
                };

                const newSlider = await SliderService.create(sliderData);
                if (newSlider) {
                    const languageValuesImages = (req as any).files.filter((file: any) =>
                        file.fieldname &&
                        file.fieldname.startsWith('languageValues[') &&
                        file.fieldname.includes('[sliderImage]')
                    );

                    if (languageValues && languageValues.length > 0) {
                        await languageValues.map((languageValue: any, index: number) => {

                            let sliderImageUrl = ''
                            if (languageValuesImages.length > 0) {
                                sliderImageUrl = handleFileUpload(req, null, languageValuesImages[index], `sliderImageUrl`, 'slider');
                            }

                            GeneralService.multiLanguageFieledsManage(newSlider._id, {
                                ...languageValue,
                                languageValues: {
                                    ...languageValue.languageValues,
                                    sliderImageUrl
                                }
                            })
                        })
                    }

                    return controller.sendSuccessResponse(res, {
                        requestedData: newSlider,
                        message: 'Slider created successfully!'
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'Something went wrong! slider cant be inserted. please try again'
                    }, req);
                }

            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) {
            if (error && error.errors && error.errors.sliderTitle && error.errors.sliderTitle.properties) {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: {
                        sliderTitle: error.errors.sliderTitle.properties.message
                    }
                }, req);
            }
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while creating Slider',
            }, req);
        }
    }


    async findOne(req: Request, res: Response): Promise<void> {
        try {
            const sliderId = req.params.id;
            if (sliderId) {
                const slider = await SliderService.findOne(sliderId);
                return controller.sendSuccessResponse(res, {
                    requestedData: slider,
                    message: 'Success'
                });
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Slider Id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = sliderSchema.safeParse(req.body);
            if (validatedData.success) {
                const sliderId = req.params.id;
                if (sliderId) {
                    const sliderImage = (req as any).files.find((file: any) => file.fieldname === 'sliderImage');

                    let updatedSliderData = req.body;
                    updatedSliderData = {
                        ...updatedSliderData,
                        sliderImageUrl: handleFileUpload(req, await SliderService.findOne(sliderId), (req.file || sliderImage), 'sliderImageUrl', 'slider'),
                        updatedAt: new Date()
                    };

                    const updatedSlider: any = await SliderService.update(sliderId, updatedSliderData);
                    if (updatedSlider) {

                        const languageValuesImages = (req as any).files.filter((file: any) =>
                            file.fieldname &&
                            file.fieldname.startsWith('languageValues[') &&
                            file.fieldname.includes('[sliderImage]')
                        );

                        let newLanguageValues: any = []
                        if (updatedSliderData.languageValues && updatedSliderData.languageValues.length > 0) {
                            for (let i = 0; i < updatedSliderData.languageValues.length; i++) {
                                const languageValue = updatedSliderData.languageValues[i];
                                let sliderImageUrl = '';
                                const matchingImage = languageValuesImages.find((image: any) => image.fieldname.includes(`languageValues[${i}]`));

                                if (languageValuesImages.length > 0 && matchingImage) {
                                    const existingLanguageValues = await GeneralService.findOneLanguageValues(multiLanguageSources.ecommerce.sliders, updatedSlider._id, languageValue.languageId);
                                    sliderImageUrl = await handleFileUpload(req, existingLanguageValues.languageValues, matchingImage, `sliderImageUrl`, 'slider');
                                } else {
                                    sliderImageUrl = updatedSliderData.languageValues[i].languageValues?.sliderImageUrl
                                }

                                const languageValues = await GeneralService.multiLanguageFieledsManage(updatedSlider._id, {
                                    ...languageValue,
                                    languageValues: {
                                        ...languageValue.languageValues,
                                        sliderImageUrl
                                    }
                                });
                                newLanguageValues.push(languageValues);
                            }
                        }

                        const updatedSliderMapped = Object.keys(updatedSlider).reduce((mapped: any, key: string) => {
                            mapped[key] = updatedSlider[key];
                            return mapped;
                        }, {});


                        return controller.sendSuccessResponse(res, {
                            requestedData: {
                                ...updatedSliderMapped,
                                languageValues: newLanguageValues
                            },
                            message: 'Slider updated successfully!'
                        }, 200, { // task log
                            sourceFromId: updatedSliderMapped._id,
                            sourceFrom: adminTaskLog.ecommerce.sliders,
                            activity: adminTaskLogActivity.update,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Slider Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Slider Id not found! Please try again with slider id',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating slider'
            }, req);
        }
    }

    async statusChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = sliderStatusSchema.safeParse(req.body);
            if (validatedData.success) {
                const sliderId = req.params.id;
                if (sliderId) {
                    let { status } = req.body;
                    const updatedSliderData = { status };

                    const updatedSlider = await SliderService.update(sliderId, updatedSliderData);
                    if (updatedSlider) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedSlider,
                            message: 'Slider status updated successfully!'
                        }, 200, { // task log
                            sourceFromId: sliderId,
                            sourceFrom: adminTaskLog.ecommerce.sliders,
                            activity: adminTaskLogActivity.statusChange,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Slider Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Slider Id not found! Please try again with slider id',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating slider'
            }, req);
        }
    }

    async positionChange(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = sliderPositionSchema.safeParse(req.body);
            if (validatedData.success) {
                const sliderId = req.params.id;
                if (sliderId) {
                    let { position } = req.body;

                    const updatedSlider = await GeneralService.changePosition(SliderModel, sliderId, position);
                    if (updatedSlider) {
                        return controller.sendSuccessResponse(res, {
                            requestedData: updatedSlider,
                            message: 'Slider status updated successfully!'
                        }, 200, { // task log
                            sourceFromId: sliderId,
                            sourceFrom: adminTaskLog.ecommerce.sliders,
                            activity: adminTaskLogActivity.positionChange,
                            activityStatus: adminTaskLogStatus.success
                        });
                    } else {
                        return controller.sendErrorResponse(res, 200, {
                            message: 'Slider Id not found!',
                        }, req);
                    }
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Slider Id not found! Please try again with slider id',
                    }, req);
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Validation error',
                    validation: formatZodError(validatedData.error.errors)
                }, req);
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, {
                message: error.message || 'Some error occurred while updating slider'
            }, req);
        }
    }

    async destroy(req: Request, res: Response): Promise<void> {
        try {
            const sliderId = req.params.id;
            if (sliderId) {
                const slider = await SliderService.findOne(sliderId);
                if (slider) {
                    const SliderServices = await SliderService.destroy(sliderId);
                    const existingLanguageValues = await GeneralService.findOneLanguageValues(multiLanguageSources.ecommerce.sliders, sliderId);
                    if (existingLanguageValues) {
                        await GeneralService.destroyLanguageValues(existingLanguageValues._id);
                    }

                    return controller.sendSuccessResponse(res,
                        { message: 'Slider deleted successfully!' },
                        200, { // task log
                        sourceFromId: sliderId,
                        sourceFrom: adminTaskLog.ecommerce.sliders,
                        activity: adminTaskLogActivity.delete,
                        activityStatus: adminTaskLogStatus.success
                    });
                } else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'This slider details not found!',
                    });
                }
            } else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Slider id not found!',
                });
            }
        } catch (error: any) { // Explicitly specify the type of 'error' as 'any'
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while deleting slider' });
        }
    }

}

export default new SlidersController();