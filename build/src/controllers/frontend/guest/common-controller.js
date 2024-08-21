"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
const base_controller_1 = __importDefault(require("../../admin/base-controller"));
const common_service_1 = __importDefault(require("../../../services/frontend/guest/common-service"));
const mongoose_1 = __importDefault(require("mongoose"));
const state_model_1 = __importDefault(require("../../../model/admin/setup/state-model"));
const city_model_1 = __importDefault(require("../../../model/admin/setup/city-model"));
const store_model_1 = __importDefault(require("../../../model/admin/stores/store-model"));
const controller = new base_controller_1.default();
class CommonController extends base_controller_1.default {
    async findAllCountries(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                return controller.sendSuccessResponse(res, {
                    requestedData: await common_service_1.default.findAllCountries(),
                    message: 'Success!'
                }, 200);
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing! please check'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching ' });
        }
    }
    async findAllStates(req, res) {
        try {
            const { countryId = '', stateId = '', getStores = '0' } = req.query;
            let query = { _id: { $exists: true }, status: '1' };
            if (countryId) {
                query.countryId = new mongoose_1.default.Types.ObjectId(countryId);
            }
            if (stateId) {
                query._id = new mongoose_1.default.Types.ObjectId(stateId);
            }
            if (getStores === '1') {
                const storeStateIds = await store_model_1.default.distinct('stateId');
                query._id = { $in: storeStateIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) };
            }
            const states = await state_model_1.default.find(query);
            return controller.sendSuccessResponse(res, {
                requestedData: states,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching states.' });
        }
    }
    async findAllCities(req, res) {
        try {
            const { countryId = '', stateId = '', cityId = '', getStores = '0' } = req.query;
            let query = { _id: { $exists: true } };
            query.status = '1';
            if (countryId) {
                query.countryId = new mongoose_1.default.Types.ObjectId(countryId);
            }
            if (stateId) {
                query.stateId = new mongoose_1.default.Types.ObjectId(stateId);
            }
            if (cityId) {
                query._id = new mongoose_1.default.Types.ObjectId(cityId);
            }
            if (getStores === '1') {
                const storeCityIds = await store_model_1.default.distinct("cityId", { cityId: { $exists: true } });
                query._id = { $in: storeCityIds.map((id) => new mongoose_1.default.Types.ObjectId(id)) };
            }
            const requestedData = await city_model_1.default.find(query);
            return controller.sendSuccessResponse(res, {
                requestedData,
                message: 'Success!',
            }, 200);
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching ' });
        }
    }
    async findAllStores(req, res) {
        try {
            const { stateId = '', cityId = '' } = req.query;
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                let query = { _id: { $exists: true } };
                query = {
                    ...query,
                    countryId,
                    status: '1',
                };
                if (stateId) {
                    query.stateId = new mongoose_1.default.Types.ObjectId(stateId);
                }
                if (cityId) {
                    query.cityId = new mongoose_1.default.Types.ObjectId(cityId);
                }
                return controller.sendSuccessResponse(res, {
                    requestedData: await common_service_1.default.findAllStores({
                        hostName: req.get('origin'),
                        query,
                    }),
                    message: 'Success!'
                }, 200);
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing! please check'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching stores' });
        }
    }
    async findWebsiteSetups(req, res) {
        try {
            const { block, blockReference } = req.query;
            let query = { _id: { $exists: true } };
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                if (block && blockReference) {
                    query = {
                        ...query,
                        countryId,
                        block: { $in: block.split(',') },
                        blockReference: { $in: blockReference.split(',') },
                        status: '1',
                    };
                    const websiteSetup = await common_service_1.default.findWebsiteSetups({
                        limit: 500,
                        hostName: req.get('origin'),
                        block,
                        blockReference,
                        query,
                    });
                    return controller.sendSuccessResponse(res, {
                        requestedData: websiteSetup,
                        message: 'Success!'
                    }, 200);
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'block and blockReference is missing! please check'
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'block and blockReference is missing! please check'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching ' });
        }
    }
    async findAllSliders(req, res) {
        try {
            const { page_size = 1, limit = 10, page, pageReference } = req.query;
            let query = { _id: { $exists: true } };
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                if (page && pageReference) {
                    query = {
                        ...query,
                        countryId,
                        page: page,
                        pageReference: pageReference,
                        status: '1',
                    };
                    const sliders = await common_service_1.default.findAllSliders({
                        page: parseInt(page_size),
                        limit: 500,
                        hostName: req.get('origin'),
                        query,
                    });
                    return controller.sendSuccessResponse(res, {
                        requestedData: sliders,
                        message: 'Success!'
                    }, 200);
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'page and pageReference is missing! please check'
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'page and pageReference is missing! please check'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching sliders' });
        }
    }
    async findAllBanners(req, res) {
        try {
            const { page_size = 1, page, pageReference } = req.query;
            let query = { _id: { $exists: true } };
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                if (page && pageReference) {
                    query = {
                        ...query,
                        countryId,
                        page: page,
                        pageReference: pageReference,
                        status: '1',
                    };
                    const banners = await common_service_1.default.findAllBanners({
                        page: parseInt(page_size),
                        limit: 500,
                        hostName: req.get('origin'),
                        query,
                    });
                    return controller.sendSuccessResponse(res, {
                        requestedData: banners,
                        message: 'Success!'
                    }, 200);
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'page and pageReference is missing! please check'
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'page and pageReference is missing! please check'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching banners' });
        }
    }
    async findPriorityProducts(req, res) {
        try {
            let query = { _id: { $exists: true }, status: '1' };
            const keysToCheck = ['newArrivalPriority', 'corporateGiftsPriority'];
            const filteredQuery = keysToCheck.reduce((result, key) => {
                if (key in req.query) {
                    result[key] = req.query[key];
                }
                return result;
            }, {});
            let filteredPriorityQuery = {};
            if (Object.keys(filteredQuery).length > 0) {
                for (const key in filteredQuery) {
                    if (filteredQuery[key] === '> 0') {
                        filteredPriorityQuery[key] = { $gt: '0' }; // Set query for key greater than 0
                    }
                    else if (filteredQuery[key] === '0') {
                        filteredPriorityQuery[key] = '0'; // Set query for key equal to 0
                    }
                    else if (filteredQuery[key] === '< 0' || filteredQuery[key] === null || filteredQuery[key] === undefined) {
                        filteredPriorityQuery[key] = { $lt: '0' }; // Set query for key less than 0
                    }
                }
            }
            query = { ...query, ...filteredPriorityQuery };
            // Log the final query to ensure it's constructed correctly
            console.log('Final query:', query);
            const products = await common_service_1.default.findPriorityProducts({
                hostName: req.get('origin'),
                query,
            });
            controller.sendSuccessResponse(res, {
                requestedData: products,
                message: 'Success'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching products' });
        }
    }
    async findCollectionProducts(req, res) {
        try {
            const { page_size = 1, page = '', pageReference = '', getspecification, getattribute, collectionproduct = '' } = req.query;
            let query = { _id: { $exists: true } };
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                if ((page === '' && pageReference === '') && (collectionproduct === '')) {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'Either page and pageReference or collectionproduct must be provided! Please check your input.'
                    }, req);
                }
                query = {
                    ...query,
                    countryId,
                    ...(collectionproduct ? { _id: new mongoose_1.default.Types.ObjectId(collectionproduct) } : {
                        page: page,
                        pageReference: pageReference
                    }),
                    status: '1',
                };
                const products = await common_service_1.default.findCollectionProducts({
                    hostName: req.get('origin'),
                    query,
                    getspecification,
                    getattribute
                });
                return controller.sendSuccessResponse(res, {
                    requestedData: products,
                    message: 'Success!'
                }, 200);
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching products' });
        }
    }
    async findCollectionCategories(req, res) {
        try {
            const { page_size = 1, page = '', pageReference = '', collectioncategory = '' } = req.query;
            let query = { _id: { $exists: true } };
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                if (page && pageReference) {
                    query = {
                        ...query,
                        countryId,
                        ...(collectioncategory ? { _id: new mongoose_1.default.Types.ObjectId(collectioncategory) } : {
                            page: page,
                            pageReference: pageReference
                        }),
                        status: '1',
                    };
                    const categories = await common_service_1.default.findCollectionCategories({
                        hostName: req.get('origin'),
                        query,
                    });
                    return controller.sendSuccessResponse(res, {
                        requestedData: categories,
                        message: 'Success!'
                    }, 200);
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'page and pageReference is missing! please check'
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'page and pageReference is missing! please check'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }
    async findCollectionBrands(req, res) {
        try {
            const { page = '', pageReference = '', collectionbrand = '' } = req.query;
            let query = { _id: { $exists: true } };
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                if (page && pageReference) {
                    query = {
                        ...query,
                        countryId,
                        ...(collectionbrand ? { _id: new mongoose_1.default.Types.ObjectId(collectionbrand) } : {
                            page: page,
                            pageReference: pageReference
                        }),
                        status: '1',
                    };
                    const brands = await common_service_1.default.findCollectionBrands({
                        hostName: req.get('origin'),
                        query,
                    });
                    return controller.sendSuccessResponse(res, {
                        requestedData: brands,
                        message: 'Success!'
                    }, 200);
                }
                else {
                    return controller.sendErrorResponse(res, 200, {
                        message: 'Error',
                        validation: 'page and pageReference is missing! please check'
                    }, req);
                }
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'page and pageReference is missing! please check'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching brands' });
        }
    }
    async findPaymentMethods(req, res) {
        try {
            const countryId = await common_service_1.default.findOneCountrySubDomainWithId(req.get('origin'));
            if (countryId) {
                let query = { _id: { $exists: true } };
                const { enableDisplay = ['0', '1', '2'] } = req.query;
                query = {
                    ...query,
                    countryId,
                    status: '1',
                };
                if (enableDisplay && enableDisplay !== '') {
                    query.enableDisplay = { $in: Array.isArray(enableDisplay) ? enableDisplay : [enableDisplay] };
                }
                else {
                    query.enableDisplay = '1';
                }
                return controller.sendSuccessResponse(res, {
                    requestedData: await common_service_1.default.findPaymentMethods({
                        hostName: req.get('origin'),
                        query,
                    }),
                    message: 'Success!'
                }, 200);
            }
            else {
                return controller.sendErrorResponse(res, 200, {
                    message: 'Error',
                    validation: 'Country is missing! please check'
                }, req);
            }
        }
        catch (error) {
            return controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching ' });
        }
    }
}
exports.default = new CommonController();
