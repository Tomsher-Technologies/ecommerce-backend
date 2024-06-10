import { FilterOptionsProps, pagination } from '../../../components/pagination';
import AttributesModel from '../../../model/admin/ecommerce/attribute-model';

import CategoryModel, { CategoryProps } from '../../../model/admin/ecommerce/category-model';
import ProductsModel from '../../../model/admin/ecommerce/product-model';
import SpecificationModel from '../../../model/admin/ecommerce/specifications-model';
import LanguagesModel from '../../../model/admin/setup/language-model';
import { attributeDetailLanguageFieldsReplace, attributeDetailsLookup, attributeLanguageFieldsReplace, attributeLookup, attributeProject } from '../../../utils/config/attribute-config';
import { brandLookup, brandObject, categoryLookup, imageLookup, productFinalProject, productMultilanguageFieldsLookup, productProject, productlanguageFieldsReplace, seoLookup, seoObject, specificationLookup, variantLookup } from '../../../utils/config/product-config';
import { specificationDetailLanguageFieldsReplace, specificationDetailsLookup, specificationLanguageFieldsReplace, specificationProject } from '../../../utils/config/specification-config';
import { getLanguageValueFromSubdomain } from '../../../utils/frontend/sub-domain';
import mongoose from 'mongoose';
import { ProductsProps } from '../../../utils/types/products';
import CategoryService from './category-service';
import CollectionsProductsModel from '../../../model/admin/website/collections-products-model';
import CollectionsBrandsModel from '../../../model/admin/website/collections-brands-model';
import ProductCategoryLinkModel from '../../../model/admin/ecommerce/product/product-category-link-model';
import CollectionsCategoriesModel from '../../../model/admin/website/collections-categories-model';
import BrandsModel from '../../../model/admin/ecommerce/brands-model';
import BrandService from './brand-service';


class ProductService {



    constructor() {
    }

    async findProducts(productOption: any): Promise<CategoryProps[]> {
        const query = productOption.query;
        const products = productOption.products
        let pipeline: any[] = [
            categoryLookup,
            variantLookup,
            imageLookup,
            brandLookup,
            brandObject,
            seoLookup,
            seoObject,
            specificationLookup,
            { $match: query }

        ];
        var productData: any = []
        var collections: any
        // var collectionProducts: any
        var brandDetail: any = []

        const collection: any = await this.collection(products)

        if (collection && collection.productData) {
            productData = collection.productData
        }
        else if (collection && collection.collectionsBrands) {
            console.log("lllllllllllllllllllll", collection.collectionsBrands);

            for await (let data of collection.collectionsBrands) {
                console.log("data", data);

                const result = await ProductsModel.find({ brand: new mongoose.Types.ObjectId(data) })
                console.log("result", result);
                if (result && result.length > 0) {
                    productData.push(result[0])
                }
            }

        }


        else {
            
            productData = await ProductsModel.aggregate(pipeline).exec();

        }

        console.log("...........", productData);

        return productData
    }


    async findAllAttributes(options: FilterOptionsProps = {}): Promise<CategoryProps[]> {

        const { query, hostName } = pagination(options.query || {}, options);
        var attributeDetail: any = []


        const productData: any = await this.findProducts(query)
        const attributeArray: any = []

        if (productData) {
            for await (let product of productData) {
                for await (let variant of product.productVariants) {
                    for await (let attribute of variant.productVariantAttributes) {

                        if (!attributeArray.includes(attribute.attributeId)) {
                            attributeArray.push(attribute.attributeId);
                        }
                    }

                }

            }


            for await (let attribute of attributeArray) {
                const query = { _id: attribute }

                let pipeline: any[] = [
                    { $match: query },
                    attributeDetailsLookup,
                    attributeProject
                ];
                const attributeData = await AttributesModel.aggregate(pipeline).exec()

                const language: any = await this.attributeLanguage(hostName, pipeline)

                const data = await AttributesModel.aggregate(language).exec()

                for (let j = 0; j < data[0].attributeValues.length; j++) {
                    if (Array.isArray(data[0].attributeValues[j].itemName) && data[0].attributeValues[j].itemName.length > 1) {
                        if (data[0].attributeValues[j].itemName[j] == undefined) {
                            data[0].attributeValues[j].itemName = attributeData[0].attributeValues[j].itemName;
                        } else {
                            data[0].attributeValues[j].itemName = data[0].attributeValues[j].itemName[j];
                        }


                    } else if (data[0].attributeValues[j].itemName.length > 1) {
                        data[0].attributeValues[j].itemName = data[0].attributeValues[j].itemName
                    } else {
                        data[0].attributeValues[j].itemName = attributeData[0].attributeValues[j].itemName
                    }
                }
                await attributeDetail.push(data[0])
            }
        }

        return attributeDetail
    }


    async attributeLanguage(hostName: any, pipeline: any): Promise<void> {
        const languageData = await LanguagesModel.find().exec();
        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
        if (languageId) {
            const attributeLookupWithLanguage = {
                ...attributeLookup,
                $lookup: {
                    ...attributeLookup.$lookup,
                    pipeline: attributeLookup.$lookup.pipeline.map((stage: any) => {
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

            pipeline.push(attributeLookupWithLanguage);

            pipeline.push(attributeLanguageFieldsReplace);

            pipeline.push(attributeDetailLanguageFieldsReplace)

        }

        pipeline.push(attributeProject);

        pipeline.push(productFinalProject);

        return pipeline
    }


    async findAllSpecifications(options: FilterOptionsProps = {}): Promise<CategoryProps[]> {

        const { query, hostName } = pagination(options.query || {}, options);
        var specificationDetail: any = []


        const productData: any = await this.findProducts(query)
        const specificationArray: any = []

        if (productData) {
            for await (let product of productData) {
                for await (let variant of product.productVariants) {
                    for await (let specification of variant.productSpecification) {

                        if (!specificationArray.includes(specification.specificationId)) {
                            specificationArray.push(specification.specificationId);
                        }
                    }
                }
            }

            for await (let specification of specificationArray) {
                const query = { _id: specification }

                let pipeline: any[] = [
                    { $match: query },
                    specificationDetailsLookup,
                    specificationProject
                ];
                const specificationData = await SpecificationModel.aggregate(pipeline).exec()

                const language: any = await this.specificationLanguage(hostName, pipeline)
                console.log("languagelanguage", language);

                const data = await SpecificationModel.aggregate(language).exec()
                // console.log("data,data",data);

                for (let j = 0; j < data[0].specificationValues.length; j++) {
                    if (Array.isArray(data[0].specificationValues[j].itemName) && data[0].specificationValues[j].itemName.length > 1) {
                        if (data[0].specificationValues[j].itemName[j] == undefined) {
                            data[0].specificationValues[j].itemName = specificationData[0].specificationValues[j].itemName;
                        } else {
                            data[0].specificationValues[j].itemName = data[0].specificationValues[j].itemName[j];
                        }


                    } else if (data[0].specificationValues[j].itemName.length > 1) {
                        data[0].specificationValues[j].itemName = data[0].specificationValues[j].itemName
                    } else {
                        data[0].specificationValues[j].itemName = specificationData[0].specificationValues[j].itemName
                    }
                }
                await specificationDetail.push(data[0])
            }
        }

        return specificationDetail
    }

    async specificationLanguage(hostName: any, pipeline: any): Promise<void> {
        const languageData = await LanguagesModel.find().exec();
        console.log("languageDatalanguageData123", hostName, languageData);

        const languageId = getLanguageValueFromSubdomain(hostName, languageData);
        if (languageId) {
            console.log("fghfghfghgfhfg", languageId);

            const specificationLookupWithLanguage = {
                ...specificationLookup,
                $lookup: {
                    ...specificationLookup.$lookup,
                    pipeline: specificationLookup.$lookup.pipeline.map((stage: any) => {
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

            pipeline.push(specificationLookupWithLanguage);

            pipeline.push(specificationLanguageFieldsReplace);

            pipeline.push(specificationDetailLanguageFieldsReplace)

        }

        pipeline.push(specificationProject);

        pipeline.push(productFinalProject);

        return pipeline
    }

    async findOne(productId: string, hostName: any): Promise<ProductsProps | null> {
        try {
            if (productId) {
                const objectId = new mongoose.Types.ObjectId(productId);

                const pipeline = [
                    { $match: { _id: objectId } },
                    categoryLookup,
                    variantLookup,
                    imageLookup,
                    brandLookup,
                    brandObject,
                    seoLookup,
                    seoObject,
                    productMultilanguageFieldsLookup,
                    specificationLookup
                ];
                // let pipeline1: any[] = [
                //     { $match: query },
                // ];

                const language: any = await this.productLanguage(hostName.hostName, pipeline)

                const categorylanguage: any = await CategoryService.categoryLanguage(hostName.hostName, pipeline)
                const categoryData: any = await CategoryModel.aggregate(categorylanguage).exec();

                // pipeline.push(categorylanguage)
                console.log("language,language124", categoryData);

                const productDataWithValues = await ProductsModel.aggregate(language);

                return productDataWithValues[0] || null;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }

    }
    async productLanguage(hostName: any, pipeline: any): Promise<void> {

        const languageData = await LanguagesModel.find().exec();
        console.log("languageDatalanguageData123", hostName, languageData);

        const languageId = await getLanguageValueFromSubdomain(hostName, languageData);
        console.log("languageId", languageId);

        if (languageId) {
            console.log("fghfghfghgfhfg", languageId);

            const productLookupWithLanguage = {
                ...productMultilanguageFieldsLookup,
                $lookup: {
                    ...productMultilanguageFieldsLookup.$lookup,
                    pipeline: productMultilanguageFieldsLookup.$lookup.pipeline.map((stage: any) => {
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

            pipeline.push(productLookupWithLanguage);

            pipeline.push(productlanguageFieldsReplace);

            // pipeline.push(productDetailLanguageFieldsReplace)

        }

        pipeline.push(productProject);

        pipeline.push(productFinalProject);

        return pipeline
    }

    async collection(products: any): Promise<void | any> {
        var collections: any
        // var collectionProducts: any
        var productData: any = []

        if (products && products.collectioncategory) {

            collections = await CollectionsCategoriesModel.findOne({ _id: products.collectioncategory })
            if (collections && collections.collectionsCategories) {

                if (collections.collectionsCategories.length > 0) {
                    for await (let data of collections.collectionsCategories) {

                        const results: any = await ProductCategoryLinkModel.find({ categoryId: new mongoose.Types.ObjectId(data) })

                        if (results && results.length > 0) {
                            for await (let result of results) {

                                const productResult = await ProductsModel.find({ _id: new mongoose.Types.ObjectId(result.productId) })
                                if (productResult) {
                                    productData.push(productResult[0])
                                }
                            }
                        }
                    }
                }
            }
            return { productData: productData }

        }
        else if (products && products.collectionbrand) {
            console.log(products.collectionbrand);

            collections = await CollectionsBrandsModel.findOne({ _id: products.collectionbrand })

            if (collections && collections.collectionsBrands) {
                return { collectionsBrands: collections.collectionsBrands }
            }

        }
        else if (products && products.collectionproduct) {
            collections = await CollectionsProductsModel.findOne({ _id: products.collectionproduct })


            if (collections && collections.collectionsProducts) {
                if (collections.collectionsProducts.length > 0) {
                    for await (let data of collections.collectionsProducts) {

                        const result = await ProductsModel.find({ _id: new mongoose.Types.ObjectId(data) })

                        productData.push(result[0])
                    }
                }
            }
            return { productData: productData }

        }
    }

}

export default new ProductService();
