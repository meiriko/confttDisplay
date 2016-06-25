function sortByStringDate(key, array){
    return _.sortBy(array, function(item){
        return (new Date(_.get(item, key)));
    });
}