const generateSlug = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const generateUniqueSlug = async (Model, text, excludeId = null) => {
  let slug = generateSlug(text);
  let count = 0;
  let uniqueSlug = slug;

  while (true) {
    const query = { slug: uniqueSlug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await Model.findOne(query);
    if (!existing) break;
    count++;
    uniqueSlug = `${slug}-${count}`;
  }

  return uniqueSlug;
};

module.exports = { generateSlug, generateUniqueSlug };
