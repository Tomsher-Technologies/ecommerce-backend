import mongoose from 'mongoose';
import { FilterOptionsProps, pagination } from '../../../components/pagination';

import BrandModel from '../../../model/admin/ecommerce/brands-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import { multilanguagefieledsBrandLookup, brandLanguageFieldsReplace } from "../../../utils/config/brand-config";
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';
import ProductService from './product-service';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import ProductCategoryLinkModel from '../../../model/admin/ecommerce/product/product-category-link-model';


class BrandService {
    constructor() { }

    async findAll(options: FilterOptionsProps = {}, collectionId: any): Promise<void> {
        const { query, hostName, } = pagination(options.query || {}, options);
        let pipeline: any[] = [];
        let collectionPipeline: any = false;
        if (collectionId) {
            collectionPipeline = await ProductService.collection(collectionId, hostName, pipeline);
        }
        if (collectionId && collectionId.collectionproduct && collectionPipeline && collectionPipeline.productIds) {
            const brandIds = await ProductsModel.find({
                _id: { $in: collectionPipeline.productIds.map((productId: any) => productId) }
            }).select('brand');
            pipeline = [{
                $match: {
                    '_id': { $in: brandIds.map((brandId: any) => brandId.brand) }
                }
            }];
        }
        if (collectionPipeline && collectionPipeline.categoryIds && collectionPipeline.categoryIds.length > 0) {
            const categoryProductsIds = await ProductCategoryLinkModel.find({ categoryId: { $in: collectionPipeline.categoryIds } }).select('productId');
            if (categoryProductsIds && categoryProductsIds.length > 0) {
                const brandIds = await ProductsModel.find({ _id: { $in: categoryProductsIds.map((categoryProductsId: any) => categoryProductsId.productId) } }).select('brand');
                pipeline.push({ $match: { '_id': { $in: brandIds.map((brandId: any) => brandId.brand) } } });
            }
        }
        if (collectionPipeline && collectionPipeline.brandIds && collectionPipeline.brandIds.length > 0) {
            pipeline.push({ $match: { '_id': { $in: collectionPipeline.brandIds.map((id: any) => new mongoose.Types.ObjectId(id)) } } });
        }
        pipeline.push({ $match: query });
        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
        if (languageId != null) {
            pipeline = await this.brandLanguage(hostName, pipeline)
        }
        const data: any = await BrandModel.aggregate(pipeline).exec();
        return data;
    }

    async brandLanguage(hostName: any, pipeline: any): Promise<any> {
        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
        if (languageId) {
            const brandLookupWithLanguage = {
                ...multilanguagefieledsBrandLookup,
                $lookup: {
                    ...multilanguagefieledsBrandLookup.$lookup,
                    pipeline: multilanguagefieledsBrandLookup.$lookup.pipeline.map((stage: any) => {
                        if (stage.$match && stage.$match.$expr) {
                            return {
                                ...stage,
                                $match: {
                                    ...stage.$match,
                                    $expr: {
                                        ...stage.$match.$expr,
                                        $and: [
                                            ...stage.$match.$expr.$and,
                                            { $eq: ['$languageId', languageId] },
                                        ]
                                    }
                                }
                            };
                        }
                        return stage;
                    })
                }
            };

            pipeline.push(brandLookupWithLanguage);

            pipeline.push(brandLanguageFieldsReplace);

        }

        // pipeline.push(brandProject);

        // pipeline.push(brandFinalProject);

        return pipeline
    }
}

export default new BrandService();
