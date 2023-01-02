const { removeStopwords } = require("stopword");
const { matchSorter } = require("match-sorter");

const getActualFilters = (allFilters) => {
  //seperating unions and intersection filters
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

const getFiltersWithoutBase = (appliedFilters) => {
  const applicablefilters = {};

  Object.keys(global.catlogkeywordsDictReverse).forEach((baseCategory) => {
    const temp = [];
    appliedFilters.every((filterArr) => {

      //filtering available filters for the current base category
      const availFilter = filterArr.filter((filter) =>
        global.catlogkeywordsDictReverse[baseCategory].has(filter)
      );

      //if base category has given filters save availFilter
      if (availFilter.length > 0) {
        temp.push(availFilter);
        return true;
      }
      //otherwise break
      return false;
    });

    //if all intersections are fullfilled, save base category with filters
    if (temp.length === appliedFilters.length)
      applicablefilters[baseCategory] = temp;

  });
  // data format if found eg: 
  // {rings: [ [ 'gender=women' ], [ 'shape=heart' ], [ 'stone_type=diamond' ] ]}
  return applicablefilters;
};

const applyFiltersOld = ({ baseCategory, appliedFilters }) => {

  // const attributesRanking = Object.keys(global.attributesData.attributes)
  // console.log( attributesRanking )

  if (!baseCategory || !global.catlogbaseCategories.includes(baseCategory)) {

    //no filters => []
    if (!appliedFilters || appliedFilters.length === 0) return [];

    //getting all filters along with base category
    const applicablefilters = getFiltersWithoutBase(appliedFilters);

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
  
  //getting product ids for each filter
  const products = global.catlogDataSecondary[baseCategory];
  const filteredProducts = [];
  appliedFilters.forEach((filterArr) => {
    //handling union filters
    const temp = [...filterArr.map((filter) => products[filter] || []).flat()];
    if (temp.length > 0) filteredProducts.push(temp);
  });

  if (filteredProducts.length === 0) return global.catlogDataSecondary[baseCategory]["all"];

  //returning intersection of filteredProducts
  return filteredProducts.reduce((a, b) => a.filter((c) => b.includes(c)));
};

const rankFilters = (appliedFilters) => {
  const filterRanking = global.attributesData.ranking
  return appliedFilters.sort((a, b) => {
    const key1 = a[0].split("=")[0]
    const key2 = b[0].split("=")[0]
    return filterRanking[key2] - filterRanking[key1]
  });
}

const applyFilters = ({ baseCategory, appliedFilters }) => { 
  if(!baseCategory){

    //no baseCategory and no filters
    if (!appliedFilters || appliedFilters.length === 0) return []

    //getting applicable base categories and respective filters for appliedFilters
    const applicableFilters = getFiltersWithoutBase(appliedFilters)

    //applying applicableFilters for each baseCategory and storing them 
    const allFilteredProducts = Object.keys(applicableFilters).map(
      baseCategory => applyFilters({
        baseCategory, 
        appliedFilters: applicableFilters[baseCategory],
      })
    );
    //returning all the unique products for each base category
    return [...new Set(allFilteredProducts.flat())];
  }
  const allProductsForBase = global.catlogDataSecondary[baseCategory]["all"];
  if (!appliedFilters || appliedFilters.length === 0) return allProductsForBase

  const products = global.catlogDataSecondary[baseCategory];
  const filteredProducts = [];

  appliedFilters.forEach((filterArr) => {
    const temp = [...filterArr.map((filter) => products[filter] || []).flat()];
    if (temp.length > 0) filteredProducts.push(temp)
  });

  if(filteredProducts.length === 0) return allProductsForBase

  let stopIntersection = false
  return filteredProducts.reduce( (arr1, arr2) => {
    if(stopIntersection) return arr1
    const uniqueProducts = arr1.filter(product => arr2.includes(product));
    if(uniqueProducts.length === 0){ 
      stopIntersection = true
      return arr1
    }
    return uniqueProducts
  })
};

const getDataFromCatlogDataPrimary = (filteredProducts) => {
  if (filteredProducts.length === 0)
    return Object.values(global.catlogDataPrimary);
  // getting the final products from catlog Primary data
  return filteredProducts.map(
    (productId) => global.catlogDataPrimary[productId]
  );
};

const sortProducts = (productData, sortByKey = "popularity") => {
  //sorting productData using global.sortDict
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
  //matching searchQueryArr againist global.catlogbaseCategories
  for (let query of searchQueryArr) {
    const result = matchSorter(global.catlogbaseCategories, query, {
      threshold: matchSorter.rankings.STARTS_WITH,
    });
    if (result.length > 0) return { result: result[0], query };
  }
  return { result: null, query: null };
};

const getAppliedfiltersInSearchQuery = (searchQueryArr) => {
  //matching searchQueryArr againist global.catlogkeywordsDic
  const appliedFilters = {};
  const potentialNamesArr = [];
  searchQueryArr.filter((query) => {
    const result = matchSorter(Object.keys(global.catlogkeywordsDict), query, {
      threshold: matchSorter.rankings.CONTAINS,
      keys: [item => item.split("=")[1]]
    });
   
    if (result.length > 0) {
      const resultArr = result[0].split("=");
      //keeping unions and intersections seperate
      appliedFilters[resultArr[0]] = [...(appliedFilters[resultArr[0]] || []), resultArr[1]];
    } else {
      //not found query go in potentialNamesArr
      potentialNamesArr.push(query);
    }
  });

  return {
    //returning filters in [ [ k1=v1, k2=v2 ], [ k3=v3, k4=v4 ] ] format
    searchFilters: Object.keys(appliedFilters).map((key) =>
      appliedFilters[key].map((ele) => `${key}=${ele}`)
    ),
    potentialNamesArr,
  };
};

const mergeFilters = ({ appliedFilters, searchFilters }) => {

  if (!appliedFilters || appliedFilters.length === 0) return searchFilters;

  //removing duplicates
  const mergedFiltersArr = new Set([
    ...appliedFilters.flat(),
    ...searchFilters.flat(),
  ]);

  //return filters in [union , union] <= intersection => [ union, union ] format
  //[  [ k1=v1, k2=v2 ], [k3=v3, k4=v4]  ]
  const temp = {};
  mergedFiltersArr.forEach((ele) => {
    const filter = ele.split("=");
    temp[filter[0]] = [...(temp[filter[0]] || []), filter[1]];
  });
  return Object.keys(temp).map(
    (key) => temp[key].map((ele) => `${key}=${ele}`));
};

const searchProductNames = ({ finalProducts, potentialNamesArr }) => {
  if (!potentialNamesArr || potentialNamesArr.length === 0)
    return finalProducts;

  let searchedData = [];
  //matching potentialNamesArr aganist product names 
  potentialNamesArr.forEach((name) => {
    const matchResult = matchSorter(finalProducts, name, {
      keys: [{ threshold: matchSorter.rankings.CONTAINS, key: "name" }],
    })
    if(matchResult.length !== 0) searchedData.push(matchResult);
  });

  if (searchedData.length === 0) return finalProducts;

  //filtering duplicates
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

const getSearchableFilters = ({ appliedFilters, searchQuery, baseCategory }) => {
  if (searchQuery.length === 0)
    return {
      finalFilters: rankFilters(appliedFilters),
      searchBaseCategory: baseCategory,
      potentialNamesArr: [],
  };

  //getting the base category searchQueryArr 
  const searchBaseCategory = !baseCategory ? getBaseCategoryInSearchQuery(
    searchQuery) : { result : baseCategory };

  //removing base category from searchQueryArr if found
  if (searchBaseCategory.query) {
    searchQuery = searchQuery.filter(
      (ele) => ele != searchBaseCategory.query
    );
  }

  //getting filters and potential names from searchQueryArr
  const { 
    searchFilters, potentialNamesArr 
  } = getAppliedfiltersInSearchQuery(searchQuery);

  //merging applied and search filters
  const finalFilters = rankFilters(mergeFilters({ appliedFilters, searchFilters }));

  return {
    finalFilters,
    searchBaseCategory: searchBaseCategory.result,
    potentialNamesArr,
  };
};

const getPriceSlug = () => {

}

const getProductAttributes = ({ searchedProducts }) => {
  //getting all keywords for searchedProducts
  const prices = new Set()
  const data = new Set(
    searchedProducts
      .map(product => {
        prices.add(product.price)
        return global.attributesData.keywordsFinal[product.pk]
      })
      .flat()
  );
  //for given keywords getting all attrib_data from global.attributesData.attributes
  const new_attributes = {};
  data.forEach((ele) => {
    const temp = ele.split("=");
    // console.log(global.attributesData.attributes[temp[0]])
    new_attributes[temp[0]] = [ ...new_attributes[temp[0]] || [] ];

    //handling price attributes
    if(temp[0] === 'price' ){
      return new_attributes[temp[0]].push({
        attrib_name: 'Price',
        attrib_slug: 'price',
        attrib_value_id: temp[1],
        attrib_value_name: temp[1],
        attrib_value_slug: temp[1]
      })
    }

    global.attributesData.attributes[temp[0]]?.forEach((attr) => {
      if (attr.attrib_value_slug === temp[1]) {
        new_attributes[temp[0]].push(attr);
      }
    });
    if(new_attributes[temp[0]].length === 0) delete new_attributes[temp[0]]
  });
  new_attributes['price'] = new_attributes.price.sort(
    (a, b) => Number(a.attrib_value_slug.split("-")[0]) - Number(b.attrib_value_slug.split("-")[0])
  )
  return new_attributes;
};

const checkProductNameMapping = (names) => {
  if(names.length === 0) return
  return global.productNamesDict[names.join(" ") ]
}

const getTopBanners = (filters) => {
  for(let filterArr of filters){
    let data
    filterArr.every(filter => {
      data = global.topBannerDict[filter]
      return !data
    })
    if(data) return data
  }
  return null
}

const getSearchQuery = (rawSearchQuery) => {
  if(!rawSearchQuery) return []
  return [...new Set(
    removeStopwords(rawSearchQuery.toLowerCase().split(" "))
  )].filter(item => item.match(/[a-zA-Z]+/g))
}

module.exports = {
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
  getSearchQuery
};
