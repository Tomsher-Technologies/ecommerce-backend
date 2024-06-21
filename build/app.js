"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
require('dotenv').config();
const allowed_origins_1 = require("./config/allowed-origins");
const admin_routers_1 = __importDefault(require("./routes/admin-routers"));
const frontend_router_1 = __importDefault(require("./routes/frontend-router"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowed_origins_1.allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.static('public'));
// app.use('/public', express.static(path.join(__dirname, 'public')));
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
app.use('/admin', admin_routers_1.default);
app.use('/api', frontend_router_1.default);
app.listen(port, () => {
    console.log("Server is listening on port " + port);
});
