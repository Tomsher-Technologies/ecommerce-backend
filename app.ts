import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cors from "cors";

require('dotenv').config();

import { url as dbUrl } from './config/database.config';

//admin
import AuthRoute from './routes/admin/auth-routes';

//admin ecommerce 
import CategoryRoutes from './routes/admin/ecommerce/category-routes';
import BrandsRoutes from './routes/admin/ecommerce/brands-routes';
import BannersRoutes from './routes/admin/ecommerce/banners-routes';
import SliderRoutes from './routes/admin/ecommerce/slider-routes';
import ProductsRoutes from './routes/admin/ecommerce/products-routes';
import AttributesRoutes from './routes/admin/ecommerce/attributes-routes';
import SpecificationRoutes from './routes/admin/ecommerce/specification-route';

// admin account
import UserRoute from './routes/admin/account/user-routes';
import UserTypeRoute from './routes/admin/account/user-type-routes';
import PrivilagesRoute from './routes/admin/account/privilage-routes';

// admin marketing
import CouponRoutes from './routes/admin/marketing/coupon-routes';
import OfferRoutes from './routes/admin/marketing/offer-routes';

// admin setup
import CountryRoutes from './routes/admin/setup/country-routes';
import LanguagesRoutes from './routes/admin/setup/languages-routes';

import CollectionProductRoutes from './routes/admin/website/collection-product-routes'

// frontend
import GuestRoutes from './routes/frontend/guest/auth-routes'

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

//admin ecommerce 
adminRouter.use('/account/user', UserRoute);
adminRouter.use('/account/user-types', UserTypeRoute);
adminRouter.use('/account/privilages', PrivilagesRoute);

//admin ecommerce 
adminRouter.use('/category', CategoryRoutes);
adminRouter.use('/brands', BrandsRoutes);
adminRouter.use('/banners', BannersRoutes);
adminRouter.use('/sliders', SliderRoutes);
adminRouter.use('/products', ProductsRoutes);
adminRouter.use('/attributes', AttributesRoutes);
adminRouter.use('/specification', SpecificationRoutes);

// admin marketing
adminRouter.use('/marketing/coupons', CouponRoutes);
adminRouter.use('/marketing/offers', OfferRoutes);

// //admin setup
adminRouter.use('/setup/country', CountryRoutes);
adminRouter.use('/setup/languages', LanguagesRoutes);

//admin website 
adminRouter.use('/website/collection-products', CollectionProductRoutes);


// adminRouter.use(logResponseStatus);
// adminRouter.use(errorMiddleware);

frontendRouter.use('/auth', GuestRoutes);


app.use('/admin', adminRouter);
app.use('/api', frontendRouter);




