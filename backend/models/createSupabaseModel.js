export default function createSupabaseModel({
  tableName,
  Entity,
  primaryKey = 'id',
  select = '*',
  defaultOrder,
}) {
  function toEntity(row) {
    return row ? Entity.fromRow(row) : null;
  }

  function applyFilters(query, filters = {}) {
    let nextQuery = query;

    Object.entries(filters.where ?? {}).forEach(([column, value]) => {
      if (Array.isArray(value)) {
        nextQuery = nextQuery.in(column, value);
      } else if (value !== undefined) {
        nextQuery = nextQuery.eq(column, value);
      }
    });

    const orderBy = filters.orderBy ?? defaultOrder;
    if (orderBy) {
      nextQuery = nextQuery.order(orderBy.column, {
        ascending: orderBy.ascending ?? true,
      });
    }

    if (filters.limit) {
      nextQuery = nextQuery.limit(filters.limit);
    }

    return nextQuery;
  }

  return {
    tableName,
    Entity,

    async findById(db, id) {
      const { data, error } = await db
        .from(tableName)
        .select(select)
        .eq(primaryKey, id)
        .maybeSingle();

      if (error) throw error;
      return toEntity(data);
    },

    async list(db, filters = {}) {
      const query = applyFilters(db.from(tableName).select(select), filters);
      const { data, error } = await query;

      if (error) throw error;
      return (data ?? []).map(toEntity);
    },

    async create(db, attributes) {
      const entity = attributes instanceof Entity ? attributes : new Entity(attributes);
      entity.assertValid();

      const { data, error } = await db
        .from(tableName)
        .insert(entity.toRow())
        .select(select)
        .single();

      if (error) throw error;
      return toEntity(data);
    },

    async update(db, id, attributes) {
      const row = Entity.toUpdateRow(attributes);
      const { data, error } = await db
        .from(tableName)
        .update(row)
        .eq(primaryKey, id)
        .select(select)
        .single();

      if (error) throw error;
      return toEntity(data);
    },

    async remove(db, id) {
      const { error } = await db.from(tableName).delete().eq(primaryKey, id);

      if (error) throw error;
      return true;
    },
  };
}
