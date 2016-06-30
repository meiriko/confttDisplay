function toggleSections(tables, event){
    var index = this.value;
    tables.each(function(){
        var sections = $(this).find('.data.column');
        if(index < 0) {
            sections.css('display', 'inherit')
        } else {
            sections.css('display', 'none')
            sections.eq(index).css('display', 'inherit');
        }
    });
}
