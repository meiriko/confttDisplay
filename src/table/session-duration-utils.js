function sessionToDuration(session){
    var result = {start: session.start};
    var end = (session.duration || session.end);
    if(end){
        result.end = _.isDate(end) ? end: new Date(session.start.getTime() + end * 60000);
    } else {
        result.end = session.start;
    }
    return result;
}

function calculateSessionEnd(session){
    var end = (session.duration || session.end || session.start);
    return (_.isDate(end) ? end: new Date(session.start.getTime() + end * 60000));
}

function calculateSessionEndIntoDay(session){
    return minutesIntoDay(calculateSessionEnd(session));
}

function minutesIntoDay(date){
    return (date.getHours() * 60 + date.getMinutes());
}

function minutesGap(date1, date2){
    return (minutesIntoDay(date2) - minutesIntoDay(date1));
}
