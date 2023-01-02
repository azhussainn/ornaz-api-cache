const axios = require("axios");
const fs = require("fs");
const { removeStopwords } = require("stopword");

function resetCatlogDataInCache() {
  console.log("===re-setting catlog data in cache===");
  global.catlogData = null;
}

function setCatlogDataInCache({
  cachedDataPrimary,
  cachedDataSecondary,
  baseCategories,
  keywordsDict,
  keywordsDictReverse,
  sortDict,
  attributes,
  keywordsFinal,
  attribute_icons,
  topBanners,
  productNamesDict,
  priceSlab
}) {

  // console.log(cachedDataSecondary.rings['price=700000-1000000'])

  console.log("===setting catlog data in cache===");
  global.catlogDataPrimary = cachedDataPrimary;
  global.catlogDataSecondary = cachedDataSecondary;
  global.catlogbaseCategories = baseCategories;
  global.catlogkeywordsDict = keywordsDict;
  global.catlogkeywordsDictReverse = keywordsDictReverse;
  global.sortDict = sortDict;
  global.attributesData = {
    attributes,
    keywordsFinal,
    attribute_icons,
    ranking: {
      'gender': 10,
      'occasion': 9,
      'metal_color': 8,
      'shape': 7,
      'stone_type': 6,
      'style': 5,
      'collections' : 4,
      'offers': 3,
      'topengagement': 2,
      'price': 1
    },
    priceSlab
  };
  global.topBannerDict = topBanners
  global.productNamesDict = productNamesDict
}

function restructureCatlogData(catlogData) {
  const cachedDataPrimary = {};
  const cachedDataSecondary = {};
  const baseCategories = [];
  const keywordsDict = {};
  const keywordsDictReverse = {};
  const sortDict = {};
  const keywordsFinal = {};
  const productNamesDict = {}

  Object.keys(catlogData.products).forEach((primaryKey) => {
    //adding productId : productData to cachedDataPrimary
    cachedDataPrimary[primaryKey] = catlogData.products[primaryKey].data;
    sortDict[primaryKey] = catlogData.products[primaryKey].sorting_info;
    keywordsFinal[primaryKey] = catlogData.products[primaryKey].keywords;

    //creating product names mapping
    const productNamesArr = [
      ...new Set(removeStopwords(
        catlogData.products[primaryKey].data.name.toLowerCase().split(" ")
      ))
    ];
    if(productNamesArr.length > 0){
      const productName = productNamesArr.join(" ")
      productNamesDict[ productName ] = [ ...productNamesDict[ productName ] || [], primaryKey ]
    }

    //getting the baseCategory
    const baseCategory = catlogData.products[primaryKey].data.category.slug;

    //adding the baseCategory to baseCategories
    if (!baseCategories.includes(baseCategory))
      baseCategories.push(baseCategory);

    // adding baseCategory: { } to cachedDataSecondary
    const keywords = catlogData.products[primaryKey].keywords;
    cachedDataSecondary[baseCategory] = {
      ...(cachedDataSecondary[baseCategory] || {}),
    };

    //adding keyword : [ productId ] to baseCategory in cachedDataSecondary
    keywords.forEach((keyword) => {
      cachedDataSecondary[baseCategory][keyword] = [
        ...(cachedDataSecondary[baseCategory][keyword] || []),
        primaryKey,
      ];
      keywordsDict[keyword] = baseCategory;
    });

    //adding baseCategory: keywords
    if (!keywordsDictReverse[baseCategory]) {
      keywordsDictReverse[baseCategory] = keywords;
    } else {
      keywordsDictReverse[baseCategory] = new Set([
        ...keywords,
        ...keywordsDictReverse[baseCategory],
      ]);
    }

    //adding all: [ productId ] to baseCategory in cachedDataSecondary
    cachedDataSecondary[baseCategory]["all"] = [
      ...(cachedDataSecondary[baseCategory]["all"] || []),
      primaryKey,
    ];
  });
  setCatlogDataInCache({
    cachedDataPrimary,
    cachedDataSecondary,
    baseCategories,
    keywordsDict,
    keywordsDictReverse,
    sortDict,
    attributes: catlogData.new_attributes,
    keywordsFinal,
    attribute_icons: catlogData.attribute_icons,
    topBanners: catlogData.top_banners,
    productNamesDict,
    priceSlab: catlogData.price_slabs 
  });
}

async function getCatlogDataApi() {
  console.log("====get catlog data from ornaz main server api===");

  try {
    const apiResponse = await axios.get(
      "https://www.ornaz.com/api/rest/v1/products/all-catalog-data/"
    );

    restructureCatlogData(apiResponse.data);
    updateCatlogDataFileStorage(apiResponse.data);
  } catch (error) {
    console.log(error);
    console.log("===Something went wrong fetching catlog data===");
  }
}

function updateCatlogDataFileStorage(data) {
  console.log("===setting catlog data in file storage==");
  let catlogData = JSON.stringify(data);
  fs.writeFileSync("./catlogData.json", catlogData);
}

function checkCatlogDataFileStorage() {
  const data = fs.readFileSync("./catlogData.json");
  if (data && data.length !== 0) {
    console.log("====catlog data found in file");
    const catlogData = JSON.parse(data);
    restructureCatlogData(catlogData);
  } else {
    console.log("====catlog data not found in file");
    getCatlogDataApi();
  }
}

function initCatlogData() {
  console.log("===initializing catlog data===");
  checkCatlogDataFileStorage();
}

module.exports = {
  initCatlogData,
};
