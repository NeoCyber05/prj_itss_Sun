import UserProfile from '../entities/UserProfile.js';
import createSupabaseModel from './createSupabaseModel.js';

const userProfileModel = createSupabaseModel({
  tableName: 'profiles',
  Entity: UserProfile,
  defaultOrder: { column: 'created_at', ascending: false },
});

export default userProfileModel;
