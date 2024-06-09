import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from "cors";

require('dotenv').config();

import { url as dbUrl } from './config/database.config';
import { allowedOrigins } from './config/allowed-origins';

import adminRouter from'./routes/admin-routers'; 
import frontendRouter from'./routes/frontend-router'; 

const app = express();
const port = process.env.PORT;

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/public", express.static('public'));

app.use(function (request, response, next) {
 
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

mongoose.Promise = global.Promise;
mongoose
.connect(process.env.MONGODB_URI as any)
.then((x) => {
   console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`)
 })
 .catch((err) => {
   console.error('Could not connect to the database', err)
 });
// app.use((req, res, next) => {
//   const dbName = req.header('Database');
//   if (!dbName) {
//     return res.status(400).json({ error: 'Database header is missing' });
//   }

//   mongoose
//     .connect(`mongodb+srv://support:eHzPLIVbpfzIfqJV@cluster0.rlxsskd.mongodb.net/${dbName}`)
//     .then((x) => {
//       console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`);
//       next();
//     })
//     .catch((err) => {
//       console.error('Could not connect to the database', err);
//       return res.status(500).json({ error: 'Could not connect to the database' });
//     });
// });
//  app.use(databaseSwitcher);
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Ecommerce" });
});

app.listen(port, () => {
  console.log("Server is listening on port " + port);
});

app.use('/admin', adminRouter);
app.use('/api', frontendRouter);

//fontend routes