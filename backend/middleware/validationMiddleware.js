import Joi from 'joi';

export const validateCustomer = (req, res, next) => {
  const schema = Joi.object({
    businessId: Joi.string().required(),
    name: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().allow(''),
    address: Joi.string().allow(''),
    gstNumber: Joi.string().allow(''),
    passportNumber: Joi.string().allow('')
  });
  
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
};

export default { validateCustomer };