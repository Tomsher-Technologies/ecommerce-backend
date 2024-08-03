import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';

require('dotenv').config();


import adminRouter from './routes/admin-routers'; 
import frontendRouter from './routes/frontend-router'; 

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: '*', // Replace '*' with your domain for security, e.g., 'https://yourdomain.com'
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  exposedHeaders: ['Content-Length', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Origin','User-Token'],
};


app.use(cors(corsOptions));
app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/public', express.static(path.join(__dirname, 'public')));

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
