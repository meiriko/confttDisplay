function formatTalkDuration(talk, index){
    var parentData = _.first(d3.selectAll($(this).closest('.session')).data());
    if(parentData){
        var offset = _(parentData.talks).take(index).sum('duration');
        return formatDuration(parentData.time && new Date(parentData.time.getTime() + offset * 60000), talk.duration);
    }
}