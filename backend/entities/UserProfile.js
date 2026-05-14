import BaseEntity, {
  isEmail,
  normalizeString,
  pickDefined,
  requireString,
} from './BaseEntity.js';

export default class UserProfile extends BaseEntity {
  constructor(attributes = {}) {
    super(attributes);
    this.email = normalizeString(attributes.email);
    this.displayName = normalizeString(attributes.displayName ?? attributes.display_name);
    this.avatarUrl = normalizeString(attributes.avatarUrl ?? attributes.avatar_url);
    this.provider = normalizeString(attributes.provider) ?? 'email';
    this.role = normalizeString(attributes.role) ?? 'user';
  }

  static fromAuthUser(user) {
    const metadata = user?.user_metadata ?? {};
    const appMetadata = user?.app_metadata ?? {};

    return new UserProfile({
      id: user?.id,
      email: user?.email ?? metadata.email,
      displayName: metadata.full_name ?? metadata.name,
      avatarUrl: metadata.avatar_url ?? metadata.picture,
      provider: appMetadata.provider,
      role: appMetadata.role,
      createdAt: user?.created_at,
      updatedAt: user?.updated_at,
    });
  }

  static fromRow(row) {
    return new UserProfile(row);
  }

  static toUpdateRow(attributes = {}) {
    return pickDefined({
      email: normalizeString(attributes.email),
      display_name: normalizeString(attributes.displayName ?? attributes.display_name),
      avatar_url: normalizeString(attributes.avatarUrl ?? attributes.avatar_url),
      provider: normalizeString(attributes.provider),
      role: normalizeString(attributes.role),
    });
  }

  validate() {
    const errors = {};

    requireString(errors, 'id', this.id);

    if (!isEmail(this.email)) {
      errors.email = 'Invalid email format';
    }

    return errors;
  }

  toRow() {
    return pickDefined({
      id: this.id,
      email: this.email,
      display_name: this.displayName,
      avatar_url: this.avatarUrl,
      provider: this.provider,
      role: this.role,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    });
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      displayName: this.displayName,
      avatarUrl: this.avatarUrl,
      provider: this.provider,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
