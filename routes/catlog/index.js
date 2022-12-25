const router = require("express").Router();
const {
  getActualFilters,
  applyFilters,
  getDataFromCatlogDataPrimary,
  sortProducts,
  getPaginatedProducts
} = require("./utils");

router.get("/:baseCategory?", async (req, res) => {
  const baseCategory = req.params.baseCategory;
  const allFilters = req.query;
  const searchQuery = allFilters["q"];
  const pageNo = allFilters["page"];
  const sortBy = allFilters["sort_by"];
  const appliedFilters = getActualFilters(allFilters);
  const filteredProducts = applyFilters({ baseCategory, appliedFilters });
  const finalProducts = getDataFromCatlogDataPrimary(filteredProducts);
  const sortedProducts = sortProducts(finalProducts, sortBy);
  const paginatedProducts = getPaginatedProducts({ sortedProducts, pageNo });
  return res.status(200).json(paginatedProducts);

});

module.exports = router;
