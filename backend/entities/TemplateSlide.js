import BaseEntity, {
  normalizeInteger,
  normalizeString,
  pickDefined,
  requireInteger,
  requireString,
} from './BaseEntity.js';

export default class TemplateSlide extends BaseEntity {
  constructor(attributes = {}) {
    super(attributes);
    this.templateId = normalizeString(attributes.templateId ?? attributes.template_id);
    this.position = normalizeInteger(attributes.position) ?? 1;
    this.title = normalizeString(attributes.title);
    this.layout = normalizeString(attributes.layout) ?? 'default';
    this.content = attributes.content ?? {};
    this.speakerNotes = normalizeString(attributes.speakerNotes ?? attributes.speaker_notes);
    this.thumbnailUrl = normalizeString(attributes.thumbnailUrl ?? attributes.thumbnail_url);
  }

  static fromRow(row) {
    return new TemplateSlide(row);
  }

  static toUpdateRow(attributes = {}) {
    return pickDefined({
      template_id: normalizeString(attributes.templateId ?? attributes.template_id),
      position: normalizeInteger(attributes.position),
      title: normalizeString(attributes.title),
      layout: normalizeString(attributes.layout),
      content: attributes.content,
      speaker_notes: normalizeString(attributes.speakerNotes ?? attributes.speaker_notes),
      thumbnail_url: normalizeString(attributes.thumbnailUrl ?? attributes.thumbnail_url),
    });
  }

  validate() {
    const errors = {};

    requireString(errors, 'templateId', this.templateId);
    requireInteger(errors, 'position', this.position, { min: 1 });

    return errors;
  }

  toRow() {
    return pickDefined({
      id: this.id ?? undefined,
      template_id: this.templateId,
      position: this.position,
      title: this.title,
      layout: this.layout,
      content: this.content,
      speaker_notes: this.speakerNotes,
      thumbnail_url: this.thumbnailUrl,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    });
  }

  toJSON() {
    return {
      id: this.id,
      templateId: this.templateId,
      position: this.position,
      title: this.title,
      layout: this.layout,
      content: this.content,
      speakerNotes: this.speakerNotes,
      thumbnailUrl: this.thumbnailUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
