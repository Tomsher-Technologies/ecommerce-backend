"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
require('dotenv').config();
const admin_routers_1 = __importDefault(require("./routes/admin-routers"));
const frontend_router_1 = __importDefault(require("./routes/frontend-router"));
const sap_routes_1 = __importDefault(require("./routes/sap/sap-routes"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    exposedHeaders: ['Content-Length', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Origin', 'User-Token'],
};
app.use((0, cors_1.default)(corsOptions));
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ['*'],
            scriptSrc: ["* data: 'unsafe-eval' 'unsafe-inline' blob:"]
        }
    }
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use('/public', express_1.default.static(path_1.default.join(__dirname, 'public')));
mongoose_1.default.Promise = global.Promise;
mongoose_1.default
    .connect(process.env.MONGODB_URI)
    .then((x) => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
})
    .catch((err) => {
    console.error('Could not connect to the database', err);
});
app.get('/', (req, res) => {
    res.json({ message: "Ecommerce" });
});
app.use('/api/v1', sap_routes_1.default);
app.use('/admin', admin_routers_1.default);
app.use('/api', frontend_router_1.default);
app.listen(port, () => {
    console.log("Server is listening on port " + port);
});
