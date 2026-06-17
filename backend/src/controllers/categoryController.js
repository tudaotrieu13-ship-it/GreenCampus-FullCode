const { getAllCategories } = require('../models/categoryModel');

const getCategories = async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = { getCategories };
