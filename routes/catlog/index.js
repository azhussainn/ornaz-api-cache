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
  checkProductNameMapping,
  getTopBanners,
  getSearchQuery,
  getHeadData
} = require("./utils");
// const moize = require('moize');


router.get("/:baseCategory?", async (req, res) => {

  const startTime = performance.now()

  const baseCategory = req.params.baseCategory;
  const allFilters = req.query;
  const rawSearchQuery = allFilters["q"];

  const pageNo = allFilters["page"];
  const sortBy = allFilters["sort_by"];

  //getting filters from request query params
  const appliedFilters = getActualFilters(allFilters);

  const searchQuery = getSearchQuery(rawSearchQuery) 

  //getting filters, base category, names from search query
  const { 
    finalFilters, searchBaseCategory, potentialNamesArr 
  } = getSearchableFilters({ appliedFilters, searchQuery, baseCategory });

  // console.log(
  //   finalFilters,
  //   searchBaseCategory,
  //   potentialNamesArr
  // )

  //checking for product names directly in global.productNamesDict
  let filteredProducts = checkProductNameMapping(potentialNamesArr)

  //filtering the products using baseCategory and finalFilters
  if(!filteredProducts){
    filteredProducts = applyFilters({
      baseCategory: baseCategory || searchBaseCategory,
      appliedFilters: finalFilters,
    });
  }else{
    //removing potential names if direct mapping found
    potentialNamesArr = []
  }

  //getting top_banner
  const top_banner = getTopBanners(finalFilters)

  //getting head data
  const head = getHeadData(finalFilters)

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

  console.log(`Func took ${Math.round(performance.now() - startTime)} milliseconds`)

  //returning all the required data
  return res.status(200).json({
    products: paginatedProducts,
    new_attributes,
    attribute_icons: global.attributesData.attribute_icons,
    meta: { ...sortingMeta, ...paginationMeta },
    top_banner,
    head,
  });
});

module.exports = router;
