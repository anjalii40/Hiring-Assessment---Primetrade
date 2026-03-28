const INVALID_KEY_PATTERN = /(^\$)|\./;

const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, nestedValue]) => {
      if (INVALID_KEY_PATTERN.test(key)) {
        const error = new Error(`Invalid input key: ${key}`);
        error.statusCode = 400;
        throw error;
      }

      acc[key] = sanitizeValue(nestedValue);
      return acc;
    }, {});
  }

  if (typeof value === 'string') {
    return value.replace(/\0/g, '');
  }

  return value;
};

const sanitizeRequest = (req, res, next) => {
  try {
    req.body = sanitizeValue(req.body);
    req.query = sanitizeValue(req.query);
    req.params = sanitizeValue(req.params);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { sanitizeRequest };
