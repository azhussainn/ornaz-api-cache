const router = require("express").Router();
const {
  getActualFilters,
  applyFilters,
  getDataFromCatlogDataPrimary,
  getSearchableFilters,
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

  const { finalFilters, searchBaseCategory, potentialNamesArr } = getSearchableFilters({ appliedFilters, searchQuery  })
  console.log(baseCategory || searchBaseCategory, "<======base category")
  console.log(finalFilters, "search filters<============")
  console.log(potentialNamesArr, "<=======potential names")

  const filteredProducts = applyFilters({ 
    baseCategory: baseCategory || searchBaseCategory, 
    appliedFilters: finalFilters
  });

  const finalProducts = getDataFromCatlogDataPrimary(filteredProducts);
  const sortedProducts = sortProducts(finalProducts, sortBy);
  const paginatedProducts = getPaginatedProducts({ sortedProducts, pageNo });
  return res.status(200).json(paginatedProducts);

});

module.exports = router;
