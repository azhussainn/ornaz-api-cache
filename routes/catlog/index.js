const router = require("express").Router();
const {
  getActualFilters,
  getApplicableFiltersWithoutBaseCategory,
  applyFilters,
  getDataFromCatlogDataPrimary,
  sortProducts,
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
  return res.status(200).json(sortedProducts);

});

module.exports = router;
