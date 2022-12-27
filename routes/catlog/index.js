const router = require("express").Router();
const {
  getActualFilters,
  applyFilters,
  getDataFromCatlogDataPrimary,
  getSearchableFilters,
  searchProductNames,
  sortProducts,
  getPaginatedProducts,
  getProductAttributes
} = require("./utils");

router.get("/:baseCategory?", async (req, res) => {
  const baseCategory = req.params.baseCategory;
  const allFilters = req.query;
  const searchQuery = allFilters["q"];
  const pageNo = allFilters["page"];
  const sortBy = allFilters["sort_by"];
  const appliedFilters = getActualFilters(allFilters);
  const { finalFilters, searchBaseCategory, potentialNamesArr } = getSearchableFilters({ appliedFilters, searchQuery  })
  // console.log(baseCategory || searchBaseCategory, "<======base category")
  // console.log(finalFilters, "search filters<============")
  // console.log(potentialNamesArr, "<=======potential names")
  const filteredProducts = applyFilters({ 
    baseCategory: baseCategory || searchBaseCategory, 
    appliedFilters: finalFilters
  });
  const finalProducts = getDataFromCatlogDataPrimary(filteredProducts);
  const searchedProducts = searchProductNames({ finalProducts, potentialNamesArr })
  const new_attributes = getProductAttributes({ searchedProducts })

  const {
    sortedProducts,
    sortingMeta
  } = sortProducts(searchedProducts, sortBy);
  const {
    paginatedProducts,
    paginationMeta
  } = getPaginatedProducts({ sortedProducts, pageNo });
  return res.status(200).json({ 
    products: paginatedProducts, 
    new_attributes ,
    attribute_icons: global.attributesData.attribute_icons,
    meta: { ...sortingMeta, ...paginationMeta }
  });

});

module.exports = router;
