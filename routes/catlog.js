const router = require('express').Router();

const getActualFilters = (allFilters) => {
    const filters = []
    Object.keys(allFilters).forEach(filterKey => {
        if(typeof allFilters[filterKey] === 'string'){
            const key = `${filterKey}=${allFilters[filterKey]}`
            if(global.catlogkeywordsDict[key]) filters.push([ key ] )
        }else{
            const tempArr = []
            allFilters[filterKey].forEach(innerVal => {
                const key = `${filterKey}=${innerVal}`
                if(global.catlogkeywordsDict[key]) tempArr.push(key)
            })
            if(tempArr.length > 0) filters.push(tempArr)
        }
    })
    return filters
}

const getApplicableFiltersWithoutBaseCategory = (appliedFilters) => {
    const applicablefilters = {  }
    Object.keys( global.catlogkeywordsDictReverse ).forEach(baseCategory => {
        const temp = [] 
        appliedFilters.every(filterArr => {
            const availFilter = filterArr.filter(filter => global.catlogkeywordsDictReverse[baseCategory].has(filter))
            if(availFilter.length > 0){ 
                temp.push(availFilter)
                return true
            }
            return false
        })
        if( temp.length === appliedFilters.length) applicablefilters[baseCategory] = temp
    })
    return applicablefilters
}

const applyFilters = ({ baseCategory, appliedFilters }) => {
    
    const products = global.catlogDataSecondary[baseCategory]
            
    //getting all products for all applied filters
    let filteredProducts = []

    //applying the union filter first
    appliedFilters.forEach(filterArr => 
        filteredProducts.push([ ...filterArr.map(filter => products[filter]).flat() ])
    )
    
    // //apllying the intersection filter
    return filteredProducts.reduce((a, b) => a.filter(c => b.includes(c)));
    
}

const getDataFromCatlogDataPrimary = (filteredProducts) => {
    // //getting the final products from catlog Primary data
    return filteredProducts.map(productId => global.catlogDataPrimary[productId])
}


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