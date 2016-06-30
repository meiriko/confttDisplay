function buildRoomsTimeTable(selector, rawData) {
    var container = d3.select(selector);
    container.selectAll('*').remove();
    var data = Defiant.getSnapshot(rawData);

    var scheduledSessions = _.filter(JSON.search(data, '/*/sessions'), _.property('time'));
    _.each(scheduledSessions, function (session) {
        if (session.time && !_.isDate(session.time)) {
            session.time = new Date(session.time);
        }
    });
    var earliestIntoDay = _(scheduledSessions).map('time').map(minutesIntoDay).min();
    var latestIntoDay = _(scheduledSessions).map(calculateSessionEnd).map(minutesIntoDay).max();
    var sortedSessionDays = _(scheduledSessions).sortBy('time').map(_.method('time.toDateString')).unique().value();
    var emptyDaysForDefaults = _.zipObject(sortedSessionDays, _.map(sortedSessionDays, _.constant([])));
    var byRoomSessions = _(scheduledSessions).groupBy('room.name').omit('undefined').mapValues(function (value) {
        return _(value).groupBy(_.method('time.toDateString'))
            .mapValues(function (value) {
                return _.sortBy(value, 'time');
            }).defaults(emptyDaysForDefaults).value();
    }).value();

    var roomTimeTables = container.selectAll('div').data(_.sortBy(d3.entries(byRoomSessions), 'key'))
        .enter().classedDiv('titled-time-table');
    roomTimeTables.classedDiv('heading').classedDiv('title').text(_.property('key'));
    var timeTables = roomTimeTables.classedDiv('time-table');
    var legendContainer = timeTables.classedDiv('legend column');
    legendContainer.classedDiv('title').text('time');
    var legendContentContainer = legendContainer.classedDiv('content');

    var baseTime = new Date(0, 0, 0, 0, 0).getTime();
    var intervals = _(d3.range(earliestIntoDay, latestIntoDay, 30));
    latestIntoDay = Math.max(latestIntoDay, intervals.last() + 30);
    var legendIntervals = intervals.map(function (offset) {
        return (
        d3.time.format('%H:%M')(new Date(baseTime + offset * 60 * 1000)) + ' - ' +
        d3.time.format('%H:%M')(new Date(baseTime + (offset + 30) * 60 * 1000)));
    }).value();
    legendContentContainer.selectAll('div.time').data(legendIntervals)
        .enter().classedDiv('time').text(_.identity);
    var dayTables = timeTables.selectAll('div.day').data(_.flow(_.property('value'), d3.entries, _.partial(sortByStringDate, 'key')))
        .enter().classedDiv('data column');
    dayTables.classedDiv('title').text(_.property('key'));
    var sessionsContainer = dayTables.classedDiv('content').selectAll('div').data(_.partial(sessionsWithGaps, earliestIntoDay, latestIntoDay))
        .enter().classedDiv('session')
        .style('flex', function (d) {
            return d.duration + ' ' + d.duration + ' 0px';
        })
        .each(function (d) {
            d3.select(this).style(_.get(d, 'session.style', {}));
        });
    sessionsContainer.classedDiv('session-title').text(_.property('session.name'));
    sessionsContainer.classedDiv('session-description').text(_.property('session.description'));
    truncate(selector, container);
}
