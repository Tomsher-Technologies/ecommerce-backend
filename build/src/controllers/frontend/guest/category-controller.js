"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const base_controller_1 = __importDefault(require("../../../controllers/admin/base-controller"));
const category_service_1 = __importDefault(require("../../../services/frontend/guest/category-service"));
const controller = new base_controller_1.default();
class CategoryController extends base_controller_1.default {
    async findAllCategory(req, res) {
        try {
            const { slug = '', category = '', brand = '' } = req.query;
            const level = '0';
            let query = { _id: { $exists: true } };
            query.status = '1';
            // if (slug) {
            //     const keywordRegex = new RegExp(slug, 'i');
            //     query = {
            //         $or: [
            //             { slug: keywordRegex },
            //         ],
            //         ...query
            //     } as any;
            // }
            // if (brand) {
            //     const keywordRegex = new RegExp(brand, 'i');
            //     const isObjectId = /^[0-9a-fA-F]{24}$/.test(brand);
            //     if (isObjectId) {
            //         query = {
            //             ...query, "brand._id": new mongoose.Types.ObjectId(brand)
            //         }
            //     } else {
            //         query = {
            //             ...query, "brand.slug": keywordRegex
            //         }
            //     }
            // }
            /*  if (category) {
  
                  const keywordRegex = new RegExp(category, 'i');
  
                  const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
  
                  if (isObjectId) {
                      
                      query = {
                          ...query, "productCategory.category._id": new mongoose.Types.ObjectId(category)
                      }
  
                  } else {
                      console.log("keywordRegex,keywordRegex",keywordRegex);
  
                      query = {
  
                          ...query, "productCategory.category.slug": keywordRegex
                      }
                  }
              }
              else {
                  query = {
                      ...query, level: level
                  } as any;
              }
  */
            if (category) {
                const keywordRegex = new RegExp(category, 'i');
                const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
                if (isObjectId) {
                    query = {
                        ...query, _id: new mongoose_1.default.Types.ObjectId(category)
                    };
                }
                else {
                    query = {
                        ...query, slug: category
                    };
                }
            }
            else {
                query = {
                    ...query, level: level
                };
            }
            // if (category) {
            //     const keywordRegex = new RegExp(category, 'i');
            //     var condition
            //     const isObjectId = /^[0-9a-fA-F]{24}$/.test(category);
            //     if (isObjectId) {
            //         condition = { parentCategory: new mongoose.Types.ObjectId(category) }
            //     } else {
            //         condition = { slug: keywordRegex }
            //     }
            //     query = {
            //         $or: [
            //             condition
            //         ],
            //         ...query
            //     } as any;
            // } else {
            //     query = {
            //         ...query, level: level
            //     } as any;
            // }
            const categories = await category_service_1.default.findAll({
                hostName: req.get('origin'),
                query,
            });
            return controller.sendSuccessResponse(res, {
                requestedData: categories,
                message: 'Success!'
            }, 200);
        }
        catch (error) {
            controller.sendErrorResponse(res, 500, { message: error.message || 'Some error occurred while fetching categories' });
        }
    }
}
exports.default = new CategoryController();
