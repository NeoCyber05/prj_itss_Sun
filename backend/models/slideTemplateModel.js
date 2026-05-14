import SlideTemplate from '../entities/SlideTemplate.js';
import createSupabaseModel from './createSupabaseModel.js';

const slideTemplateModel = createSupabaseModel({
  tableName: 'slide_templates',
  Entity: SlideTemplate,
  defaultOrder: { column: 'updated_at', ascending: false },
});

export default slideTemplateModel;
