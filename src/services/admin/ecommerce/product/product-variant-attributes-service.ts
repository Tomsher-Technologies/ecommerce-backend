import { FilterOptionsProps, pagination } from '../../../../components/pagination';

import ProductVariantAttributesModel, { ProductVariantAttributesProps } from '../../../../model/admin/ecommerce/product/product-variant-attribute-model';

class ProductVariantAttributeService {

    private lookup: any;
    private project: any;
    constructor() {

        this.project = {
            $project: {
                _id: 1,
                productId: 1,
                sku: 1,
                countryId: 1,
                price: 1,
                quantity: 1,
                discountPrice: 1,
                isDefualt: 1,
                hsn: 1,
                mpn: 1,
                barcode: 1,
                variantDescription: 1,
                cartMinQuantity: 1,
                cartMaxQuantity: 1,
                status: 1,
                createdAt: 1,
            }
        }
    }

    async findAll(options: FilterOptionsProps = {}): Promise<ProductVariantAttributesProps[]> {
        const { query, skip, limit, sort } = pagination(options.query || {}, options);

        const defaultSort = { createdAt: -1 };
        let finalSort = sort || defaultSort;
        const sortKeys = Object.keys(finalSort);
        if (sortKeys.length === 0) {
            finalSort = defaultSort;
        }

        let pipeline: any[] = [
            { $match: query },
            { $skip: skip },
            { $limit: limit },
            { $sort: finalSort },

            this.project
        ];

        return ProductVariantAttributesModel.aggregate(pipeline).exec();
    }

    async getTotalCount(query: any = {}): Promise<number> {
        try {
            const totalCount = await ProductVariantAttributesModel.countDocuments(query);
            return totalCount;
        } catch (error) {
            throw new Error('Error fetching total count of productVariantAttributes');
        }
    }

    async create(productVariantAttributes: any): Promise<ProductVariantAttributesProps | null> {
        try {

            if (productVariantAttributes) {

                const existingEntries = await ProductVariantAttributesModel.findOne({
                    productId: productVariantAttributes.productId,
                    variantId: productVariantAttributes.variantId,
                    attributeId: productVariantAttributes.attributeId,
                    attributeDetailId: productVariantAttributes.attributeDetailId,

                });

                let attributeValue: any = {};
                if (existingEntries) {

                    const filter = {
                        productId: productVariantAttributes.productId,
                        variantId: productVariantAttributes.variantId,
                        attributeId: productVariantAttributes.attributeId,
                        attributeDetailId: productVariantAttributes.attributeDetailId,


                    };
                    const update = {
                        $set: {
                            productId: productVariantAttributes.productId,
                            variantId: productVariantAttributes.variantId,
                            attributeId: productVariantAttributes.attributeId,
                            attributeDetailId: productVariantAttributes.attributeDetailId,
                            createdAt: new Date()
                        }
                    };

                    const options = {
                        upsert: false,
                        new: true
                    };

                    attributeValue = await ProductVariantAttributesModel.findOneAndUpdate(filter, update, options);
                    return attributeValue

                } else {


                    const isEmptyValue = Object.values(productVariantAttributes).some(value => (value !== ''));
                    // console.log("--**--------------",isEmptyValue);

                    if (isEmptyValue) {

                        const productVariantAttributeData = {

                            productId: productVariantAttributes.productId,
                            variantId: productVariantAttributes.variantId,
                            attributeId: productVariantAttributes.attributeId,
                            attributeDetailId: productVariantAttributes.attributeDetailId,
                            createdAt: new Date()
                        };
                        // console.log("productVariantAttributeData", productVariantAttributeData);

                        attributeValue = await ProductVariantAttributesModel.create(productVariantAttributeData);

                        // console.log("attributeValue", attributeValue);


                    }
                    return { ...attributeValue }


                }
            } else {
                console.log("null:::");

                return null
            }
        } catch {
            return null
        }
    }
    async find(productId: string): Promise<ProductVariantAttributesProps[]> {

        return ProductVariantAttributesModel.find({ productId: productId })
    }

    async findOne(productVariantAttributeId: string): Promise<ProductVariantAttributesProps | null> {
        if (productVariantAttributeId) {
            const pipeline = [
                { $match: { _id: productVariantAttributeId } },
                this.lookup,
                this.project
            ];

            const productVariantAttributeDataWithValues = await ProductVariantAttributesModel.aggregate(pipeline);

            return productVariantAttributeDataWithValues[0];
        } else {
            return null;
        }
    }

    async update(productVariantAttributeId: string, productVariantAttributeData: any): Promise<ProductVariantAttributesProps | null> {
        const updatedproductVariantAttribute = await ProductVariantAttributesModel.findByIdAndUpdate(
            productVariantAttributeId,
            productVariantAttributeData,
            { new: true, useFindAndModify: false }
        );

        if (updatedproductVariantAttribute) {
            const pipeline = [
                { $match: { _id: updatedproductVariantAttribute._id } },
                this.lookup,
                this.project
            ];

            const updatedproductVariantAttributeWithValues = await ProductVariantAttributesModel.aggregate(pipeline);

            return updatedproductVariantAttributeWithValues[0];
        } else {
            return null;
        }
    }

    async destroy(productVariantAttributeId: string): Promise<ProductVariantAttributesProps | null> {
        return ProductVariantAttributesModel.findOneAndDelete({ _id: productVariantAttributeId });
    }

    async variantAttributeService(productId: string | null, variantDetails: any, variantId: string): Promise<ProductVariantAttributesProps[]> {
        try {
            if (productId) {
                const existingEntries = await ProductVariantAttributesModel.find({ productId: productId });
                if (existingEntries) {
                    const variantAttributeIDsToRemove = existingEntries
                        .filter(entry => !variantDetails?.some((data: any) => data?._id?.toString() === entry._id.toString()))
                        .map(entry => entry._id);

                    await ProductVariantAttributesModel.deleteMany({ productId: productId, _id: { $in: variantAttributeIDsToRemove } });
                }
                if (variantDetails) {
                    const variantAttributePromises = await Promise.all(variantDetails.map(async (data: any) => {

                        if (data.attributeId != '' && data.attributeDetailId != '' && data?._id != '' && data?._id != 'undefined') {
                            const existingEntry = await ProductVariantAttributesModel.findOne({ _id: data._id });
                            if (existingEntry) {
                                // Update existing document
                                await ProductVariantAttributesModel.findByIdAndUpdate(existingEntry._id, { ...data, productId: productId });

                            }
                            else {
                                // Create new document
                                await ProductVariantAttributesModel.create({ attributeId: data.attributeId, attributeDetailId: data.attributeDetailId, productId: productId, variantId: variantId });
                            }
                        }
                    }));

                    await Promise.all(variantAttributePromises);
                }
                return await ProductVariantAttributesModel.find({ productId: productId });
            } else {
                throw 'Could not find product Id';
            }

        } catch (error) {
            console.error('Error in Product Variant attribute service:', error);
            throw error;
        }
    }
}

export default new ProductVariantAttributeService();
