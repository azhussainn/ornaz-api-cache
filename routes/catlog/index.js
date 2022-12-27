const router = require("express").Router();
const {
  getActualFilters,
  applyFilters,
  getDataFromCatlogDataPrimary,
  getSearchableFilters,
  searchProductNames,
  sortProducts,
  getPaginatedProducts,
  getProductAttributes,
} = require("./utils");

router.get("/:baseCategory?", async (req, res) => {
  const baseCategory = req.params.baseCategory;
  const allFilters = req.query;
  const searchQuery = allFilters["q"];
  const pageNo = allFilters["page"];
  const sortBy = allFilters["sort_by"];

  //getting all filters that can be applied on the data
  const appliedFilters = getActualFilters(allFilters);

  //getting filters, base category, names from search query
  const { finalFilters, searchBaseCategory, potentialNamesArr } =
    getSearchableFilters({ appliedFilters, searchQuery });

  //filtering the products using baseCategory and finalFilters
  const filteredProducts = applyFilters({
    baseCategory: baseCategory || searchBaseCategory,
    appliedFilters: finalFilters,
  });

  //getting actual product data from filteredProducts
  const finalProducts = getDataFromCatlogDataPrimary(filteredProducts);

  //applying search name filter on actual product data
  const searchedProducts = searchProductNames({
    finalProducts,
    potentialNamesArr,
  });

  //getting product attributes
  const new_attributes = getProductAttributes({ searchedProducts });

  //sorting the product data
  const { sortedProducts, sortingMeta } = sortProducts(
    searchedProducts,
    sortBy
  );

  //paginating the sorted product data
  const { paginatedProducts, paginationMeta } = getPaginatedProducts({
    sortedProducts,
    pageNo,
  });

  //returning all the required data
  return res.status(200).json({
    products: paginatedProducts,
    new_attributes,
    attribute_icons: global.attributesData.attribute_icons,
    meta: { ...sortingMeta, ...paginationMeta },
  });
});

module.exports = router;
