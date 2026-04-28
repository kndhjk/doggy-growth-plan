// ─────────────────────────────────────────────────────────────
// validateBody — small schema-driven request body validator
//
// Usage:
//   const validateBody = require('../middleware/validateBody');
//   router.post('/',
//     validateBody({
//       type: { required: true, oneOf: ['feed','water', ...] },
//       note: { type: 'string', maxLength: 500, default: '' },
//     }),
//     handler);
//
// Supported per-field rules:
//   required:   true    → 400 if missing
//   type:       'string' | 'number' | 'boolean'
//   oneOf:      [a,b,c] → must be one of these values
//   maxLength:  N       → string length cap
//   minLength:  N
//   default:    v       → fill in if missing/undefined
//
// On failure responds 400 with { error, field, rule }.
// Mutates req.body to apply defaults / trims; downstream handlers see clean
// data and don't have to re-check.
// ─────────────────────────────────────────────────────────────

function validateBody(schema) {
  return (req, res, next) => {
    const body = req.body || {};
    const rejected = (field, rule, error) =>
      res.status(400).json({ error, field, rule });

    for (const [field, rules] of Object.entries(schema)) {
      let value = body[field];

      if ((value === undefined || value === null) && 'default' in rules) {
        value = rules.default;
        body[field] = value;
      }

      if (rules.required && (value === undefined || value === null || value === '')) {
        return rejected(field, 'required', `${field} is required`);
      }

      if (value === undefined || value === null) continue;

      if (rules.type && typeof value !== rules.type) {
        return rejected(field, 'type', `${field} must be a ${rules.type}`);
      }

      if (rules.oneOf && !rules.oneOf.includes(value)) {
        return rejected(field, 'oneOf', `${field} must be one of ${rules.oneOf.join(', ')}`);
      }

      if (typeof value === 'string') {
        if (rules.maxLength != null && value.length > rules.maxLength) {
          return rejected(field, 'maxLength', `${field} must be ≤ ${rules.maxLength} chars`);
        }
        if (rules.minLength != null && value.length < rules.minLength) {
          return rejected(field, 'minLength', `${field} must be ≥ ${rules.minLength} chars`);
        }
      }
    }

    req.body = body;
    next();
  };
}

module.exports = validateBody;
