"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.frontendPagination = exports.pagination = void 0;
const pagination = (query, options) => {
    let { page = 1, limit = 10, sort, hostName, blockReference, block } = options;
    page = Number(page) || 1;
    limit = Number(limit) || 10;
    const skip = (page - 1) * limit;
    return { query, skip, limit, sort, hostName, blockReference, block };
};
exports.pagination = pagination;
const frontendPagination = (query, options) => {
    let { page = 1, limit, sort, hostName, blockReference, block } = options;
    page = Number(page) || 1;
    limit = Number(limit);
    const skip = (page - 1) * limit;
    return { query, skip, limit, sort, hostName, blockReference, block };
};
exports.frontendPagination = frontendPagination;
