import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

const dbConnections: { [key: string]: mongoose.Connection } = {};

const connectToDatabase = async (dbName: string) => {

    const dbUri = process.env[`${dbName.toUpperCase()}_MONGODB_URI`];

    if (!dbUri) {
        throw new Error(`No URI found for database ${dbName}`);
    }else{
        return dbUri
    }

};

const databaseSwitcher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dbName = req.headers['database'] as string;

        if (!dbName) {
            return res.status(400).json({ message: 'Database header is required' });
        }

        const connection: any = await connectToDatabase(dbName);
        if (connection) {
            mongoose.Promise = global.Promise;
            mongoose
                .connect(connection)
                .then((x) => {
                    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
                })
                .catch((err) => {
                    console.error('Could not connect to the database', err)
                });
            next();
        }
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ message: 'Database connection error' });
    }
};

export default databaseSwitcher;

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