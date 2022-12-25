const router = require('express').Router();
const {
    getActualFilters,
    getApplicableFiltersWithoutBaseCategory, 
    applyFilters,
    getDataFromCatlogDataPrimary
} = require("./utils");


router.get("/:baseCategory?", async (req, res) => {
    const baseCategory = req.params.baseCategory
    const allFilters = req.query
    const searchQuery = allFilters["q"]
    const pageNo = allFilters["page"]
    const sortBy = allFilters["sort_by"]
    const appliedFilters = getActualFilters(allFilters)

    //check if base category given.
    if(baseCategory && global.catlogbaseCategories.includes(baseCategory)){
        if(appliedFilters.length > 0){
            console.log("bc and af")
            filteredProducts = applyFilters({ baseCategory, appliedFilters })
            const finalProducts = getDataFromCatlogDataPrimary(filteredProducts)
            return res.status(200).json( finalProducts )
        }else{
            console.log("bc but no af")
            //getting all products for the given base category
            const products = global.catlogDataSecondary[baseCategory]['all']
            const finalProducts = getDataFromCatlogDataPrimary(products)
            return res.status(200).json( finalProducts )
        }

    }
    //no base category / doesnt match 
    else{
        if(appliedFilters.length > 0){
            console.log("no bc but af")
            let allFilteredProducts = []
            const applicablefilters = getApplicableFiltersWithoutBaseCategory(appliedFilters)

            Object.keys(applicablefilters).forEach(baseCategory => {
                const filteredProducts = applyFilters({ baseCategory, appliedFilters: applicablefilters[baseCategory] })
                allFilteredProducts.push(filteredProducts)
            })

            const finalProducts = getDataFromCatlogDataPrimary([...new Set(allFilteredProducts.flat())])
            return res.status(200).json( finalProducts )

        }else{
            console.log("no bc and no af")

            //getting the final products from catlog Primary data
            const finalProducts = Object.values(global.catlogDataPrimary)
            return res.status(200).json( finalProducts )
        }
    }
})

module.exports = router;