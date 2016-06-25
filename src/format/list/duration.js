function formatDuration(start, duration){
    var result = '';
    if(start) {
        result = d3.time.format('%H:%M')(start);
        if(duration){
            var end = (_.isDate(duration) ? duration : new Date(start.getTime() + duration * 60000))
            if (end) {
                result += ' - ' + d3.time.format('%H:%M')(end);
            }
        }
    } else if(duration && !_.isDate(duration)){
        return (duration + ' minutes');
    }

    return result;
}
