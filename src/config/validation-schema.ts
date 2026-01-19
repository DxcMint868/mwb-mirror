import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  FRONTEND_URL: Joi.string().default('http://localhost:5173'),
  CLERK_SECRET_KEY: Joi.string().required(),
  CLERK_PUBLISHABLE_KEY: Joi.string().required(),
  CLERK_JWK_PUBLIC_KEY: Joi.string().required(),
  STRIPE_SECRET_KEY: Joi.string().required(),
  STRIPE_WEBHOOK_SECRET: Joi.string().required(),
  STRIPE_CONNECTED_ACCOUNT_ID: Joi.string().required(),
  OMISE_SECRET_KEY: Joi.string().optional(),
  DATABASE_URL: Joi.string().required(),
});
