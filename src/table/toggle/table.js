function toggleTables(tables, event){
    if(this.value < 0){
        tables.css('display', 'inherit');
    } else {
        tables.css('display', 'none');
        tables.eq(this.value).css('display', 'inherit');
    }
}
