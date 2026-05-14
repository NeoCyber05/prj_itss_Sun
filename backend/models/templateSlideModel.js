import TemplateSlide from '../entities/TemplateSlide.js';
import createSupabaseModel from './createSupabaseModel.js';

const templateSlideModel = createSupabaseModel({
  tableName: 'template_slides',
  Entity: TemplateSlide,
  defaultOrder: { column: 'position', ascending: true },
});

export default templateSlideModel;
