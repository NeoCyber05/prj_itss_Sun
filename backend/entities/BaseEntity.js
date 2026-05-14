export class EntityValidationError extends Error {
  constructor(entityName, errors) {
    super(`${entityName} validation failed`);
    this.name = 'EntityValidationError';
    this.entityName = entityName;
    this.errors = errors;
  }
}

export function normalizeString(value) {
  if (value === null || value === undefined) return null;

  const trimmed = String(value).trim();
  return trimmed || null;
}

export function normalizeInteger(value) {
  if (value === null || value === undefined || value === '') return null;

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : value;
}

export function normalizeDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString();
}

export function pickDefined(row) {
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined),
  );
}

export function requireString(errors, field, value) {
  if (!normalizeString(value)) {
    errors[field] = 'Required';
  }
}

export function requireInteger(errors, field, value, { min } = {}) {
  if (!Number.isInteger(value)) {
    errors[field] = 'Must be an integer';
    return;
  }

  if (min !== undefined && value < min) {
    errors[field] = `Must be greater than or equal to ${min}`;
  }
}

export function requireOneOf(errors, field, value, allowedValues) {
  if (!allowedValues.includes(value)) {
    errors[field] = `Must be one of: ${allowedValues.join(', ')}`;
  }
}

export function isEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default class BaseEntity {
  constructor(attributes = {}) {
    this.id = attributes.id ?? null;
    this.createdAt = normalizeDate(attributes.createdAt ?? attributes.created_at);
    this.updatedAt = normalizeDate(attributes.updatedAt ?? attributes.updated_at);
  }

  validate() {
    return {};
  }

  assertValid() {
    const errors = this.validate();

    if (Object.keys(errors).length > 0) {
      throw new EntityValidationError(this.constructor.name, errors);
    }

    return this;
  }
}
