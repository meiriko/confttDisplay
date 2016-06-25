function addD3Action(name, actionFunc) {
    _.set(d3.selection.enter.prototype, name, actionFunc);
    _.set(d3.selection.prototype, name, actionFunc);
}

addD3Action('appendWithClass', function(type, className){
    return this.append(type).classed(className, true);
});

addD3Action('classedDiv', function(className){
    return this.appendWithClass('div', className);
});