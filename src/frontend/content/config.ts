module.exports = {
  collections: {
    blog: {
      name: 'Blog',
      navigation: {
        fields: ['title', 'date', 'description', 'category', 'tags'],
        sort: [{ field: 'date', direction: 'desc' }],
        pagination: {
          perPage: 10,
        },
      },
    },
  },
}
