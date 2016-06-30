function tabifySections(tables, tabs, rbGroupName){
    var sections = tables.first().find('.column.data .title');
    var sectionsSelector = _.map(sections, function(section, index){
        return '<label class="radio-inline"><input type="radio" name="' + rbGroupName + '" value="' + index +
            '">' + $(section).text() + '</label>'
    });
    var rButtons = $('<div><label class="radio-inline"><input type="radio" name="' + rbGroupName +
        '" value="-1" checked>all</label>' + sectionsSelector.join('') + '</div>');
    rButtons.find('input').on('click', _.partial(toggleSections, tables));
    rButtons.insertAfter(tabs);
}

