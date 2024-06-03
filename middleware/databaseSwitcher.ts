import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

const dbConnections: { [key: string]: mongoose.Connection } = {};

const connectToDatabase = async (dbName: string) => {

    const dbUri = process.env[`${dbName.toUpperCase()}_MONGODB_URI`];

    if (!dbUri) {
        throw new Error(`No URI found for database ${dbName}`);
    }

    if (!dbConnections[dbName]) {
        return dbUri
    }

    return false;
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
