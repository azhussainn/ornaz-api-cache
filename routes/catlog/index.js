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
// const moize = require('moize');


router.get("/:baseCategory?", async (req, res) => {

  const startTime = performance.now()

  const baseCategory = req.params.baseCategory;
  const allFilters = req.query;
  const searchQuery = allFilters["q"];
  const pageNo = allFilters["page"];
  const sortBy = allFilters["sort_by"];

  const appliedFilters = getActualFilters(allFilters);

  //getting filters, base category, names from search query
  const { finalFilters, searchBaseCategory, potentialNamesArr } =
    getSearchableFilters({ appliedFilters, searchQuery, baseCategory });

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

  const endTime = performance.now()

  console.log(`Func took ${Math.round(endTime - startTime)} milliseconds`)

  //returning all the required data
  return res.status(200).json({
    products: paginatedProducts,
    new_attributes,
    attribute_icons: global.attributesData.attribute_icons,
    meta: { ...sortingMeta, ...paginationMeta },
  });
});

module.exports = router;
