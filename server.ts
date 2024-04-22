import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from "cors";

require('dotenv').config();

import { url as dbUrl } from './config/database.config.ts';

import AuthRoute from './routes/admin/auth-routes.ts';
import UserRoute from './routes/admin/user-routes.ts';
import UserTypeRoute from './routes/admin/user-type-routes.ts';
import CategoryRoutes from './routes/admin/ecommerce/category-routes.ts';
import BrandsRoutes from './routes/admin/ecommerce/brands-routes.ts';
import BannersRoutes from './routes/admin/ecommerce/banners-routes.ts';
import ProductsRoutes from './routes/admin/ecommerce/products-routes.ts';
import AttributesRoutes from './routes/admin/ecommerce/attributes-routes.ts';
import CouponRoutes from './routes/admin/marketing/coupon-routes.ts';
import OfferRoutes from './routes/admin/marketing/offer-routes.ts';
import CountryRoutes from './routes/admin/setup/country-routes.ts';
import CollectionProductRoutes from './routes/admin/website/collection-product-routes.ts'

import GuestRoutes from './routes/frontend/guest/auth-routes.ts'

const app = express();
const port = process.env.PORT;

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/public", express.static('public'));


const corsOrigin = {
  origin: process.env.FRONTEND_BASE_URL, //or whatever port your frontend is using
  credentials: true,
  optionSuccessStatus: 200
}
app.use(cors(corsOrigin));

mongoose.Promise = global.Promise;
mongoose
  .connect(process.env.MONGODB_URI as any)
  .then(() => {
    console.log("Database Connected Successfully!!");
  })
  .catch((err) => {
    console.log('Could not connect to the database', err);
    process.exit(1);
  });

app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Ecommerce" });
});

app.listen(port, () => {
  console.log("Server is listening on port " + port);
});

const adminRouter = express.Router();
const frontendRouter = express.Router();

// admin
adminRouter.use('/auth', AuthRoute);
// adminRouter.use(authMiddleware); // Apply authMiddleware only to the following routes
adminRouter.use('/user', UserRoute);
adminRouter.use('/user-types', UserTypeRoute);
adminRouter.use('/category', CategoryRoutes);
adminRouter.use('/brands', BrandsRoutes);
adminRouter.use('/banners', BannersRoutes);
adminRouter.use('/products', ProductsRoutes);
adminRouter.use('/attributes', AttributesRoutes);

adminRouter.use('/marketing/coupons', CouponRoutes);
adminRouter.use('/marketing/offers', OfferRoutes);

adminRouter.use('/setup/country', CountryRoutes);

adminRouter.use('/website/collection-products', CollectionProductRoutes);


// adminRouter.use(logResponseStatus);
// adminRouter.use(errorMiddleware);

frontendRouter.use('/auth', GuestRoutes);


app.use('/admin', adminRouter);
app.use('/api', frontendRouter);





