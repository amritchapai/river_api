import Joi from "joi";

const riverQuerySchema = Joi.object({
  //lat is required and having fixed range of value -90 to 90
  lat: Joi.number().min(-90).max(90).required().messages({
    "number.base": "Latitude must be a number",
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90",
    "any.required": "Latitude is required",
  }),

  //lng is required and having fixed range of value -180 to 180
  lng: Joi.number().min(-180).max(180).required().messages({
    "number.base": "Longitude must be a number",
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180",
    "any.required": "Longitude is required",
  }),
  //radius is optional having deafult 10
  radius: Joi.number().min(0.1).max(100).default(10).messages({
    "number.base": "Radius must be a number",
    "number.min": "Radius must be at least 0.1 km",
    "number.max": "Radius cannot exceed 100 km",
  }),
});

const validateRiverQuery = (req, res, next) => {
  const { error, value } = riverQuerySchema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      error: "validation_error",
      message: error.details[0].message,
      details: error.details,
    });
  }

  req.validatedQuery = value;
  next();
};

export default validateRiverQuery;
