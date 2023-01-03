require("../index.js");
const {
  getSearchableFilters,
} = require("../routes/catlog/utils");


describe("test search query and applied filters", () => {

  it("case 1", (done) => {
    const appliedFilters = [ [ 'metal_color=white-gold' ] ]
    const searchQuery = [ 'women', 'engagement', 'solitare', 'ring' ]
    const baseCategory = null
    const { 
      finalFilters, searchBaseCategory, potentialNamesArr 
    } = getSearchableFilters({ appliedFilters, searchQuery, baseCategory });
    done();
    console.log(finalFilters,       "<====filters")
    console.log(searchBaseCategory, "<====base category")
    console.log(potentialNamesArr,  "<=====potential names\n")
  });

  it("case 2", (done) => {
    const appliedFilters = [  ]
    const searchQuery = [ 'men', 'everyday', 'necklace', 'bre' ]
    const baseCategory = null
    const { 
      finalFilters, searchBaseCategory, potentialNamesArr 
    } = getSearchableFilters({ appliedFilters, searchQuery, baseCategory });
    done();
    console.log(finalFilters, "<====filters")
    console.log(searchBaseCategory, "<====base category")
    console.log(potentialNamesArr, "<=====potential names\n")
  });

  it("case 3", (done) => {
    const appliedFilters = [ [ 'shape=pear' ] ]
    const searchQuery = [ 'gift', 'girlfriend', 'proposal' ]
    const baseCategory = null
    const { 
      finalFilters, searchBaseCategory, potentialNamesArr 
    } = getSearchableFilters({ appliedFilters, searchQuery, baseCategory });
    done();
    console.log(finalFilters, "<====filters")
    console.log(searchBaseCategory, "<====base category")
    console.log(potentialNamesArr, "<=====potential names\n")
  });

  it("case 4", (done) => {
    const appliedFilters = [ ]
    const searchQuery = [ 'aniversary', 'wife', 'ring', 'diamond' ]
    const baseCategory = null
    const { 
      finalFilters, searchBaseCategory, potentialNamesArr 
    } = getSearchableFilters({ appliedFilters, searchQuery, baseCategory });
    done();
    console.log(finalFilters, "<====filters")
    console.log(searchBaseCategory, "<====base category")
    console.log(potentialNamesArr, "<=====potential names\n")
  });

});

