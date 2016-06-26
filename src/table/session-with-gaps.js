function sessionsWithGaps(start, end, sessionWrapper){
    var sessions = _.map(sessionWrapper.value, function(session){
        return {
            start: minutesIntoDay(session.time) - start,
            end: calculateSessionEndIntoDay(session) -  start,
            session: session
        };
    });
    var breaks = _([0, _.map(sessions, function(session){
        return [session.time, session.end];
    }), end - start]).flattenDeep().chunk(2).reject(_.spread(_.eq))
        .map(_.partial(_.zipObject,['start', 'end'])).value();
    var schedule = _([sessions, breaks]).flatten().sortBy('start').each(function(item){
        item.duration = item.end - item.time;
    }).value();
    return (schedule);
}
