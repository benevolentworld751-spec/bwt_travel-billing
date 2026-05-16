// import Joi from 'joi';

// export const validateCustomer = (req, res, next) => {
//   const schema = Joi.object({
//     businessId: Joi.string().required(),
//     name: Joi.string().required(),
//     phone: Joi.string().required(),
//     email: Joi.string().email().allow(''),
//     address: Joi.string().allow(''),
//     gstNumber: Joi.string().allow(''),
//     passportNumber: Joi.string().allow('')
//   });
  
//   const { error } = schema.validate(req.body);
//   if (error) return res.status(400).json({ message: error.details[0].message });
//   next();
// };

// export default { validateCustomer };

// backend/middleware/validationMiddleware.js

export const validateCustomer = (req, res, next) => {
  const { name, phone, businessId } = req.body;

  // 1. Business ID is ALWAYS required for both POST and PUT
  if (!businessId) {
    return res.status(400).json({ message: "Business ID is required" });
  }

  // 2. Name and Phone are only mandatory for NEW customers (POST)
  // Or if they are actually being sent in an update (PUT)
  if (req.method === 'POST') {
    if (!name || !phone) {
      return res.status(400).json({ message: "Name and Phone Number are required" });
    }
  }

  // 3. For Updates (PUT), if name or phone ARE provided, they shouldn't be empty
  if (req.method === 'PUT') {
    if (name !== undefined && name.trim() === "") {
      return res.status(400).json({ message: "Name cannot be empty" });
    }
    if (phone !== undefined && phone.trim() === "") {
      return res.status(400).json({ message: "Phone cannot be empty" });
    }
  }

  next();
};
export default { validateCustomer };