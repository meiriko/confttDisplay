function tabifyTable(selector){
    var tablesContainer = $(selector);
    var tables = tablesContainer.find('.titled-time-table');
    var tableNames = tables.find('.heading .title');
    var rbGroupName = selector.replace(/[\\s.]/gi, '');
    var tablesSelector = _.map(tableNames, function(tableName, index){
        return '<label class="radio-inline"><input type="radio" name="' + rbGroupName + '" value="' + index +
            '">' + $(tableName).text() + '</label>'
    });
    var rButtons = $('<div><label class="radio-inline"><input type="radio" name="' + rbGroupName + '" value="-1"' +
        'checked>all</label>' + tablesSelector.join('') + '</div>');
    rButtons.find('input').on('click', _.partial(toggleTables, tables));
    var tabs = rButtons.insertBefore(tablesContainer.children().first());
    tabifySections(tables, tabs, rbGroupName + '-sections');
}
