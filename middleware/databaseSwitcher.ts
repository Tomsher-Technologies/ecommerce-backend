import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { databases } from '../config/database.config';

const connectToDatabase = async (dbName: string) => {
    const dbUri = databases[dbName];
    if (!dbUri) {
        throw new Error(`No URI found for database ${dbName}`);
    }
    return dbUri;
};

const databaseSwitcher = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dbName = req.headers['database'] as string;

        if (!dbName) {
            return res.status(400).json({ message: 'Database header is required' });
        }

        const dbUri = await connectToDatabase(dbName);

        if (dbUri) {
            // Close the existing mongoose connection if it exists
            if (mongoose.connection.readyState === 1) { // 1 means connected
                await mongoose.connection.close();
            }

            mongoose.Promise = global.Promise;
            await mongoose.connect(dbUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000, // Adjust the timeout as needed
                socketTimeoutMS: 45000, // Adjust the timeout as needed
                connectTimeoutMS: 30000, // Adjust the timeout as needed
            }as any);
            console.log(`Connected to MongoDB: ${dbUri}`);
            next();
        }
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ message: 'Database connection error' });
    }
};


export default databaseSwitcher;
