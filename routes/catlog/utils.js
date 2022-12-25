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
  const products = global.catlogDataSecondary[baseCategory];

  //getting all products for all applied filters
  let filteredProducts = [];

  //applying the union filter first
  appliedFilters.forEach((filterArr) =>
    filteredProducts.push([
      ...filterArr.map((filter) => products[filter]).flat(),
    ])
  );

  // //apllying the intersection filter
  return filteredProducts.reduce((a, b) => a.filter((c) => b.includes(c)));
};

const getDataFromCatlogDataPrimary = (filteredProducts) => {
  // //getting the final products from catlog Primary data
  return filteredProducts.map(
    (productId) => global.catlogDataPrimary[productId]
  );
};

const sortProducts = (productData, sortByKey = "popularity") => {
  return productData.sort((a, b) => {
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
};

module.exports = {
  getActualFilters,
  getApplicableFiltersWithoutBaseCategory,
  applyFilters,
  getDataFromCatlogDataPrimary,
  sortProducts,
};
