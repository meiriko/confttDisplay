function buildDaysTimeTable(selector, rawData){
    var container = d3.select(selector);
    container.selectAll('*').remove();
    var data = Defiant.getSnapshot(rawData);

    var scheduledSessions = _.filter(JSON.search(data, '/*/sessions'), _.property('time'));
    _.each(scheduledSessions, function(session){
        if(session.time && !_.isDate(session.time)){
            session.time = new Date(session.time);
        }
    });
    var earliestIntoDay = _(scheduledSessions).map('time').map(minutesIntoDay).min();
    var latestIntoDay = _(scheduledSessions).map(calculateSessionEnd).map(minutesIntoDay).max();
    var daySpan = latestIntoDay - earliestIntoDay;

    var roomsList = _(scheduledSessions).map('room.name').compact().uniq().sortBy().value();
    var emptyRoomsForDefaults = _.zipObject(roomsList, _.map(roomsList, _.constant([])));
    var byDaySessions = _.sortBy(d3.entries(_(scheduledSessions).groupBy(_.method('time.toDateString'))
        .mapValues(function(value){
            return _(value).groupBy(_.property('room.name')).omit('undefined').mapValues(function(value) {
                return _.sortBy(value, 'time');
            }).defaults(emptyRoomsForDefaults).value();
        }).value()), function(day){
        return new Date(day.key);
    });
    var dayTimeTables = container.selectAll('div').data(byDaySessions)
        .enter().classedDiv('room-time-table');
    dayTimeTables.classedDiv('heading').classedDiv('title').text(_.property('key'));
    var timeTables = dayTimeTables.classedDiv('time-table');
    var legendContainer = timeTables.classedDiv('legend column');
    legendContainer.classedDiv('title').text('time');
    var legendContentContainer = legendContainer.classedDiv('content');

    var baseTime = new Date(0,0,0,0,0).getTime();
    var intervals = _(d3.range(earliestIntoDay, latestIntoDay, 30));
    latestIntoDay = Math.max(latestIntoDay, intervals.last() + 30);
    var legendIntervals = intervals.map(function(offset){
        return (
        d3.time.format('%H:%M')(new Date(baseTime + offset * 60 * 1000)) + ' - ' +
        d3.time.format('%H:%M')(new Date(baseTime + (offset + 30)* 60 * 1000)));
    }).value();
    legendContentContainer.selectAll('div.time').data(legendIntervals)
        .enter().classedDiv('time').text(_.identity);
    var roomTables = timeTables.selectAll('div.day').data(_.flow(_.property('value'), d3.entries, _.partial(_.sortBy, _, 'key')))
        .enter().classedDiv('day column');
    roomTables.classedDiv('title').text(_.property('key'));
    var sessionsContainer = roomTables.classedDiv('content').selectAll('div').data(_.partial(sessionsWithGaps, earliestIntoDay, latestIntoDay))
        .enter().classedDiv('session')
        .style('flex', function(d){return d.duration + ' ' + d.duration + ' 0px';})
        .each(function(d){
            d3.select(this).style(_.get(d, 'session.style', {}));
        });
    sessionsContainer.classedDiv('session-title').text(_.property('session.name'));
    sessionsContainer.classedDiv('session-description').text(_.property('session.description'));
    truncate(selector, container);
}
