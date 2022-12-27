const { removeStopwords } = require("stopword");
const { matchSorter } = require("match-sorter");

const getActualFilters = (allFilters) => {
  const filters = [];
  Object.keys(allFilters).forEach((filterKey) => {
    if (typeof allFilters[filterKey] === "string") {
      const key = `${filterKey}=${allFilters[filterKey]}`;
      if (global.catlogkeywordsDict[key]) filters.push([key]);
    } else {
      const tempArr = [];
      allFilters[filterKey].forEach((innerVal) => {
        const key = `${filterKey}=${innerVal}`;
        if (global.catlogkeywordsDict[key]) tempArr.push(key);
      });
      if (tempArr.length > 0) filters.push(tempArr);
    }
  });
  return filters;
};

const getApplicableFiltersWithoutBaseCategory = (appliedFilters) => {
  const applicablefilters = {};
  Object.keys(global.catlogkeywordsDictReverse).forEach((baseCategory) => {
    const temp = [];
    appliedFilters.every((filterArr) => {
      const availFilter = filterArr.filter((filter) =>
        global.catlogkeywordsDictReverse[baseCategory].has(filter)
      );
      if (availFilter.length > 0) {
        temp.push(availFilter);
        return true;
      }
      return false;
    });
    if (temp.length === appliedFilters.length)
      applicablefilters[baseCategory] = temp;
  });
  return applicablefilters;
};

const applyFilters = ({ baseCategory, appliedFilters }) => {
  if (!baseCategory || !global.catlogbaseCategories.includes(baseCategory)) {
    if (!appliedFilters || appliedFilters.length === 0) return [];
    const applicablefilters =
      getApplicableFiltersWithoutBaseCategory(appliedFilters);
    const allFilteredProducts = Object.keys(applicablefilters).map(
      (baseCategory) =>
        applyFilters({
          baseCategory,
          appliedFilters: applicablefilters[baseCategory],
        })
    );
    return [...new Set(allFilteredProducts.flat())];
  }
  if (!appliedFilters || appliedFilters.length === 0)
    return global.catlogDataSecondary[baseCategory]["all"];
  const products = global.catlogDataSecondary[baseCategory];
  const filteredProducts = [];
  appliedFilters.forEach((filterArr) => {
    const temp = [...filterArr.map((filter) => products[filter] || []).flat()];
    if (temp.length > 0) filteredProducts.push(temp);
  });
  if (filteredProducts.length === 0) return filteredProducts;
  return filteredProducts.reduce((a, b) => a.filter((c) => b.includes(c)));
};

const getDataFromCatlogDataPrimary = (filteredProducts) => {
  if (filteredProducts.length === 0)
    return Object.values(global.catlogDataPrimary);
  // //getting the final products from catlog Primary data
  return filteredProducts.map(
    (productId) => global.catlogDataPrimary[productId]
  );
};

const sortProducts = (productData, sortByKey = "popularity") => {
  const sortedProducts = productData.sort((a, b) => {
    let k1 = b.pk;
    let k2 = a.pk;
    let key = sortByKey;
    if (sortByKey.startsWith("-")) {
      k1 = a.pk;
      k2 = b.pk;
      key = sortByKey.slice(1);
    }
    return global.sortDict[k1][key] - global.sortDict[k2][key];
  });
  return {
    sortedProducts,
    sortingMeta: {
      now_sorted_by: sortByKey,
      is_descending: sortByKey.startsWith("-") ? false : true,
    },
  };
};

const getPaginatedProducts = ({ sortedProducts, pageNo = 1 }) => {
  let currentPage = Number(pageNo);
  if (!currentPage || currentPage < 1) currentPage = 1;
  const lastPage = Math.ceil(sortedProducts.length / 30);
  if (pageNo >= lastPage) currentPage = lastPage;
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * 30,
    currentPage * 30
  );
  return {
    paginatedProducts,
    paginationMeta: {
      lastPage,
      from: (currentPage - 1) * 30,
      total_items: sortedProducts.length,
      to: (currentPage - 1) * 30 + paginatedProducts.length,
    },
  };
};

const getBaseCategoryInSearchQuery = (searchQueryArr) => {
  for (let query of searchQueryArr) {
    const result = matchSorter(global.catlogbaseCategories, query, {
      threshold: matchSorter.rankings.STARTS_WITH,
    });
    if (result.length > 0) return { result: result[0], query };
  }
  return { result: null, query: null };
};

const getAppliedfiltersInSearchQuery = (searchQueryArr) => {
  const appliedFilters = {};
  const potentialNamesArr = [];
  searchQueryArr.filter((query) => {
    const result = matchSorter(Object.keys(global.catlogkeywordsDict), query, {
      threshold: matchSorter.rankings.CONTAINS,
    });
    if (result.length > 0) {
      const res = result[0].split("=");
      appliedFilters[res[0]] = [...(appliedFilters[res[0]] || []), res[1]];
    } else {
      potentialNamesArr.push(query);
    }
  });
  return {
    searchFilters: Object.keys(appliedFilters).map((key) =>
      appliedFilters[key].map((ele) => `${key}=${ele}`)
    ),
    potentialNamesArr,
  };
};

const mergeFilters = ({ appliedFilters, searchFilters }) => {
  if (!appliedFilters || appliedFilters.length === 0) return searchFilters;
  const mergedFiltersArr = new Set([
    ...appliedFilters.flat(),
    ...searchFilters.flat(),
  ]);
  const temp = {};
  mergedFiltersArr.forEach((ele) => {
    const filter = ele.split("=");
    temp[filter[0]] = [...(temp[filter[0]] || []), filter[1]];
  });
  return Object.keys(temp).map((key) =>
    temp[key].map((ele) => `${key}=${ele}`)
  );
};

const searchProductNames = ({ finalProducts, potentialNamesArr }) => {
  if (!potentialNamesArr || !potentialNamesArr.length === 0)
    return finalProducts;
  let searchedData = [];
  potentialNamesArr.forEach((name) => {
    searchedData.push(
      matchSorter(finalProducts, name, {
        keys: [{ threshold: matchSorter.rankings.CONTAINS, key: "name" }],
      })
    );
  });
  if (searchedData.length === 0) return finalProducts;
  const tempKeys = {};
  searchedData = searchedData.flat().filter((product) => {
    if (!tempKeys[product.pk]) {
      tempKeys[product.pk] = true;
      return product;
    }
  });
  if (searchedData.length === 0) return finalProducts;
  return searchedData;
};

const getSearchableFilters = ({ appliedFilters, searchQuery }) => {
  if (!searchQuery)
    return {
      finalFilters: appliedFilters,
      searchBaseCategory: null,
      potentialNamesArr: [],
    };
  let searchQueryArr = removeStopwords(searchQuery.toLowerCase().split(" "));
  const searchBaseCategory = getBaseCategoryInSearchQuery(searchQueryArr);
  if (searchBaseCategory.result) {
    searchQueryArr = searchQueryArr.filter(
      (ele) => ele != searchBaseCategory.query
    );
  }
  const { searchFilters, potentialNamesArr } =
    getAppliedfiltersInSearchQuery(searchQueryArr);
  const finalFilters = mergeFilters({ appliedFilters, searchFilters });

  return {
    finalFilters,
    searchBaseCategory: searchBaseCategory?.result,
    potentialNamesArr,
  };
};

const getProductAttributes = ({ searchedProducts }) => {
  const data = new Set(
    searchedProducts
      .map((product) => global.attributesData.keywordsFinal[product.pk])
      .flat()
  );
  const new_attributes = {};
  data.forEach((ele) => {
    const temp = ele.split("=");
    new_attributes[temp[0]] = [ ...new_attributes[temp[0]] || [] ];
    global.attributesData.attributes[temp[0]].forEach((attr) => {
      if (attr.attrib_value_slug === temp[1]) {
        new_attributes[temp[0]].push(attr);
      }
    });
  });
  console.log(new_attributes)
  return new_attributes;
};

module.exports = {
  getActualFilters,
  applyFilters,
  getDataFromCatlogDataPrimary,
  getSearchableFilters,
  searchProductNames,
  sortProducts,
  getPaginatedProducts,
  getProductAttributes,
};
