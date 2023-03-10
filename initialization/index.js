const axios = require("axios");
const fs = require("fs");
const { removeStopwords } = require("stopword");
const { staticHeadData } = require("../static");


const getHeadData = (headResponseObj) => {
  const headDataDict = {};
  for (let key in headResponseObj) {
    const headDataCopy = { ...staticHeadData };
    const headFilterData = headResponseObj[key];

    //title
    const title = headFilterData.title;
    headDataCopy.page_title = title;
    headDataCopy.seo.title = title;
    headDataCopy.og.title = title;
    headDataCopy.twitter.title = title;

    //description
    const description = headFilterData.description;
    headDataCopy.seo.description = description;
    headDataCopy.og.description = description;
    headDataCopy.twitter.description = description;

    //keywords
    const keywords = headFilterData.keywords;
    headDataCopy.seo.keywords = keywords;

    //image
    const image = headFilterData.og_image;
    headDataCopy.og.image = image;
    headDataCopy.twitter.image = image;

    headDataDict[key] = headDataCopy;
  }

  return headDataDict;
};

const setCatlogDataInCache = ({
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
  headDataDict,
}) => {

  global.catlogMain = {
    catlogDataPrimary : cachedDataPrimary,
    catlogDataSecondary : cachedDataSecondary,
    catlogbaseCategories : baseCategories,
    catlogkeywordsDict : keywordsDict,
    catlogkeywordsDictReverse : keywordsDictReverse,
    sortDict : sortDict,
    attributesData : {
      attributes,
      keywordsFinal,
      attribute_icons,
      ranking: {
        gender: 10,
        occasion: 9,
        metal_color: 8,
        shape: 7,
        stone_type: 6,
        style: 5,
        collections: 4,
        offers: 3,
        topengagement: 2,
        price: 1,
      },
    },
    topBannerDict : topBanners,
    productNamesDict : productNamesDict,
    headData : headDataDict,
  }
};

const restructureCatlogData = (catlogData) => {

  console.log("====restructuring Catlog api data====")
  const cachedDataPrimary = {};
  const cachedDataSecondary = {};
  const baseCategories = [];
  const keywordsDict = {};
  const keywordsDictReverse = {};
  const sortDict = {};
  const keywordsFinal = {};
  const productNamesDict = {};

  Object.keys(catlogData.products).forEach((primaryKey) => {
    //adding productId : productData to cachedDataPrimary
    cachedDataPrimary[primaryKey] = catlogData.products[primaryKey].data;
    sortDict[primaryKey] = catlogData.products[primaryKey].sorting_info;
    keywordsFinal[primaryKey] = catlogData.products[primaryKey].keywords;

    //creating product names mapping
    const productNamesArr = [
      ...new Set(
        removeStopwords(
          catlogData.products[primaryKey].data.name.toLowerCase().split(" ")
        )
      ),
    ];
    if (productNamesArr.length > 0) {
      const productName = productNamesArr.join(" ");
      productNamesDict[productName] = [
        ...(productNamesDict[productName] || []),
        primaryKey,
      ];
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
      keywordsDictReverse[baseCategory] = [...new Set([...keywords, ...keywordsDictReverse[baseCategory] ])];
    }

    //adding all: [ productId ] to baseCategory in cachedDataSecondary
    cachedDataSecondary[baseCategory]["all"] = [
      ...(cachedDataSecondary[baseCategory]["all"] || []),
      primaryKey,
    ];
  });

  //head response obj sample
  const headResponseObj = {
    "gender=women": {
      title: "Buy Engagement Rings For Couples Online | ORNAZ",
      description:
        "Shop from the latest Rings design collection - Find the best Rings for couples online. Choose from the latest collection of Diamonds rings, engagement rings, solitaire Rings, platinum Rings, gold Rings at best price.",
      keywords:
        "Couple Rings, couples, gifts, gifts for women, gift for men, customise, rings, gold, gold Rings, platinum, best designs",
      og_image: {
        url: "https://d3rodw1h7g0i9b.cloudfront.net/favicons/mstile-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Buy Engagement Rings For Couples Online | ORNAZ",
      },
    },
    "collections=gift": {
      title: "Buy Engagement Rings For Couples Online | ORNAZ",
      description:
        "Shop from the latest Rings design collection - Find the best Rings for couples online. Choose from the latest collection of Diamonds rings, engagement rings, solitaire Rings, platinum Rings, gold Rings at best price.",
      keywords:
        "Couple Rings, couples, gifts, gifts for women, gift for men, customise, rings, gold, gold Rings, platinum, best designs",
      og_image: {
        url: "https://d3rodw1h7g0i9b.cloudfront.net/favicons/mstile-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Buy Engagement Rings For Couples Online | ORNAZ",
      },
    },
    default: {
      title: "Buy Engagement Rings For Couples Online | ORNAZ",
      description:
        "Shop from the latest Rings design collection - Find the best Rings for couples online. Choose from the latest collection of Diamonds rings, engagement rings, solitaire Rings, platinum Rings, gold Rings at best price.",
      keywords:
        "Couple Rings, couples, gifts, gifts for women, gift for men, customise, rings, gold, gold Rings, platinum, best designs",
      og_image: {
        url: "https://d3rodw1h7g0i9b.cloudfront.net/favicons/mstile-1200x630.png",
        width: 1200,
        height: 630,
        alt: "Buy Engagement Rings For Couples Online | ORNAZ",
      },
    },
  };

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
    headDataDict: getHeadData(headResponseObj),
  });
};

const getCatlogDataApi = async (errorCallBack=false) => {
  console.log("====get catlog data from ornaz main server api===");

  try {
    const apiResponse = await axios.get(
      "https://www.ornaz.com/api/rest/v1/products/all-catalog-data/"
    );

    restructureCatlogData(apiResponse.data);
    updateCatlogDataFileStorage(apiResponse.data);
  } catch (error) {
    if(errorCallBack) return { error };
  }
};

const updateCatlogDataFileStorage = (data) => {
  console.log("===setting catlog data in file storage==");
  let catlogData = JSON.stringify(data);
  fs.writeFileSync("./static/catlogData.json", catlogData);
};

const checkCatlogDataFileStorage = () => {
  const data = fs.readFileSync("./static/catlogData.json");
  if (data && data.length !== 0) {
    console.log("====catlog data found in file");
    const catlogData = JSON.parse(data);
    restructureCatlogData(catlogData);
  } else {
    console.log("====catlog data not found in file");
    getCatlogDataApi();
  }
};

const initCatlogData = () => {
  console.log("===initializing catlog data===");
  checkCatlogDataFileStorage();
};

module.exports = {
  initCatlogData,
  getCatlogDataApi
};
