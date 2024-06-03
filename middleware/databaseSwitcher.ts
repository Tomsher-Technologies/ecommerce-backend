import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

const dbConnections: { [key: string]: mongoose.Connection } = {};

const connectToDatabase = async (dbName: string): Promise<mongoose.Connection> => {
  const dbUri = process.env[`${dbName.toUpperCase()}_MONGODB_URI`];

  if (!dbUri) {
    throw new Error(`No URI found for database ${dbName}`);
  }

  if (!dbConnections[dbName]) {
    const connection = await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions);
    dbConnections[dbName] = connection.connection;
  }

  return dbConnections[dbName];
};

const databaseSwitcher = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbName = req.headers['database'] as string;

    if (!dbName) {
      return res.status(400).json({ message: 'Database header is required' });
    }

    const connection = await connectToDatabase(dbName);
    (req as any).dbConnection = connection; // Attach the connection to the request object

    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ message: 'Database connection error' });
  }
};

export default databaseSwitcher;
