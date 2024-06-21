import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';

require('dotenv').config();

import { url as dbUrl } from './config/database.config';
import { allowedOrigins } from './config/allowed-origins';

import adminRouter from './routes/admin-routers'; 
import frontendRouter from './routes/frontend-router'; 

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
// app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['*'],
        scriptSrc: ["* data: 'unsafe-eval' 'unsafe-inline' blob:"]
      }
    }
  })
);

mongoose.Promise = global.Promise;
mongoose
  .connect(process.env.MONGODB_URI as any)
  .then((x) => {
    console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
  })
  .catch((err) => {
    console.error('Could not connect to the database', err);
  });

app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Ecommerce" });
});

app.use('/admin', adminRouter);
app.use('/api', frontendRouter);

app.listen(port, () => {
  console.log("Server is listening on port " + port);
});
