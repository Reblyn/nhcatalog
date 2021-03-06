const Category = require('../models/category');

async function listCategories (ctx) {
  const { language } = ctx.state;

  const flat = await Category.query()
    .modify('setLocale', 'category_names', 'cat_id', 'categories.id', language)
    .select('id', 'slug', 'order', 'parent')
    .where('is_menu', true);

  const categories = await Category.query().where('parent', null)
    .modify('setLocale', 'category_names', 'cat_id', 'categories.id', language)
    .select('id', 'slug', 'order', 'menu_icon as icon')
    .orderBy('order', 'name', 'id', 'slug')
    .where('is_menu', true)
    .withGraphFetched('children')
    .modifyGraph('children', (builder) => {
      builder.modify('setLocale', 'category_names', 'cat_id', 'categories.id', language)
        .select('id', 'slug', 'order')
        .where('is_menu', true)
        .orderBy('order', 'name', 'id', 'slug');
    });

  if (categories && flat) {
    ctx.set('Cache-Control', 'max-age=3600');
    ctx.status = 200;
    ctx.body = {
      categories, flat,
    };
  } else {
    ctx.status = 404;
    ctx.body = {
      status: 'error',
      message: 'Could not find any categories.',
    };
  }
}

module.exports = { listCategories };
