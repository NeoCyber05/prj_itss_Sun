import BaseEntity, {
  normalizeInteger,
  normalizeString,
  pickDefined,
  requireInteger,
  requireOneOf,
  requireString,
} from './BaseEntity.js';

export const TEMPLATE_STATUSES = ['draft', 'published', 'archived'];
export const TEMPLATE_VISIBILITIES = ['private', 'public', 'unlisted'];

export default class SlideTemplate extends BaseEntity {
  constructor(attributes = {}) {
    super(attributes);
    this.ownerId = normalizeString(attributes.ownerId ?? attributes.owner_id);
    this.title = normalizeString(attributes.title);
    this.description = normalizeString(attributes.description);
    this.subject = normalizeString(attributes.subject);
    this.thumbnailUrl = normalizeString(
      attributes.thumbnailUrl ?? attributes.thumbnail_url ?? attributes.image,
    );
    this.slideCount = normalizeInteger(attributes.slideCount ?? attributes.slide_count ?? attributes.slides) ?? 0;
    this.visibility = normalizeString(attributes.visibility) ?? 'private';
    this.status = normalizeString(attributes.status) ?? 'draft';
    this.ratingAverage = Number(attributes.ratingAverage ?? attributes.rating_average ?? 0);
    this.viewCount = normalizeInteger(attributes.viewCount ?? attributes.view_count) ?? 0;
  }

  static fromRow(row) {
    return new SlideTemplate(row);
  }

  static fromHomeCard(card) {
    return new SlideTemplate({
      id: card.id,
      title: card.title,
      thumbnailUrl: card.image,
      slideCount: card.slides,
      updatedAt: card.date,
      visibility: 'public',
      status: 'published',
    });
  }

  static toUpdateRow(attributes = {}) {
    return pickDefined({
      owner_id: normalizeString(attributes.ownerId ?? attributes.owner_id),
      title: normalizeString(attributes.title),
      description: normalizeString(attributes.description),
      subject: normalizeString(attributes.subject),
      thumbnail_url: normalizeString(attributes.thumbnailUrl ?? attributes.thumbnail_url),
      slide_count: normalizeInteger(attributes.slideCount ?? attributes.slide_count),
      visibility: normalizeString(attributes.visibility),
      status: normalizeString(attributes.status),
      rating_average: attributes.ratingAverage ?? attributes.rating_average,
      view_count: normalizeInteger(attributes.viewCount ?? attributes.view_count),
    });
  }

  validate() {
    const errors = {};

    requireString(errors, 'title', this.title);
    requireInteger(errors, 'slideCount', this.slideCount, { min: 0 });
    requireInteger(errors, 'viewCount', this.viewCount, { min: 0 });
    requireOneOf(errors, 'visibility', this.visibility, TEMPLATE_VISIBILITIES);
    requireOneOf(errors, 'status', this.status, TEMPLATE_STATUSES);

    if (Number.isNaN(this.ratingAverage) || this.ratingAverage < 0 || this.ratingAverage > 5) {
      errors.ratingAverage = 'Must be a number between 0 and 5';
    }

    return errors;
  }

  toRow() {
    return pickDefined({
      id: this.id ?? undefined,
      owner_id: this.ownerId,
      title: this.title,
      description: this.description,
      subject: this.subject,
      thumbnail_url: this.thumbnailUrl,
      slide_count: this.slideCount,
      visibility: this.visibility,
      status: this.status,
      rating_average: this.ratingAverage,
      view_count: this.viewCount,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    });
  }

  toJSON() {
    return {
      id: this.id,
      ownerId: this.ownerId,
      title: this.title,
      description: this.description,
      subject: this.subject,
      thumbnailUrl: this.thumbnailUrl,
      slideCount: this.slideCount,
      visibility: this.visibility,
      status: this.status,
      ratingAverage: this.ratingAverage,
      viewCount: this.viewCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
