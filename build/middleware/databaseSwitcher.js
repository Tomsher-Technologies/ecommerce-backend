"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dbConnections = {};
const connectToDatabase = async (dbName) => {
    const dbUri = process.env[`${dbName.toUpperCase()}_MONGODB_URI`];
    if (!dbUri) {
        throw new Error(`No URI found for database ${dbName}`);
    }
    else {
        return dbUri;
    }
};
const dbUrls = {
    timehouse: 'mongodb+srv://support:eHzPLIVbpfzIfqJV@cluster0.rlxsskd.mongodb.net/',
    smartbaby: 'mongodb+srv://support:eHzPLIVbpfzIfqJV@cluster0.rlxsskd.mongodb.net/',
    homestyle: 'mongodb+srv://support:eHzPLIVbpfzIfqJV@cluster0.rlxsskd.mongodb.net/',
    beyondfresh: 'mongodb+srv://support:eHzPLIVbpfzIfqJV@cluster0.rlxsskd.mongodb.net/'
};
const databaseSwitcher = async (req, res, next) => {
    try {
        const dbName = req.headers['database'];
        const serverSelectionTimeoutMS = 5000;
        if (!dbName) {
            return res.status(400).json({ message: 'Database header is required' });
        }
        const dbUrl = dbUrls[dbName];
        if (!dbUrl) {
            return res.status(400).json({ message: 'Invalid database name in header' });
        }
        mongoose_1.default.Promise = global.Promise;
        console.log('dbUrl', dbName, dbUrl);
        // Check if the connection is already established to avoid redundant connections
        if (mongoose_1.default.connection.readyState !== 1) { // 1 means connected
            await mongoose_1.default.disconnect();
            mongoose_1.default.connect(dbUrls[dbName] + dbName);
            // await mongoose.connect(dbUrl, { serverSelectionTimeoutMS }); // Specify the database name explicitly
            console.log(`Connected to Mongo! Database name: "${dbName}"`);
        }
        next();
    }
    catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ message: 'Database connection error' });
    }
};
exports.default = databaseSwitcher;
// const connectToDatabase = async (dbName: string) => {
//     const dbUri = databases[dbName];
//     if (!dbUri) {
//         throw new Error(`No URI found for database ${dbName}`);
//     }
//     if (!dbConnections[dbName]) {
//         // Establish a new connection and store it in the dbConnections object
//         const connection = await mongoose.createConnection(dbUri, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//             serverSelectionTimeoutMS: 4000,
//             socketTimeoutMS: 45000,
//             connectTimeoutMS: 30000,
//         } as any);
//         dbConnections[dbName] = connection;
//     }
//     return dbConnections[dbName];
// };
// const databaseSwitcher = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const dbName = req.headers['database'] as string;
//         if (!dbName) {
//             return res.status(400).json({ message: 'Database header is required' });
//         }
//         const connection = await connectToDatabase(dbName);
//         if (connection) {
//             // Use the connection for the current request
//             (req as any).dbConnection = connection;
//             console.log(`Using MongoDB connection: ${dbName}`);
//             next();
//         }
//     } catch (error) {
//         console.error('Database connection error:', error);
//         res.status(500).json({ message: 'Database connection error' });
//     }
// };
