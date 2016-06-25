function buildTimeTable(selector, rawData) {
    var container = d3.select(selector);
    var data = Defiant.getSnapshot(rawData);

    var scheduledSessions = _.filter(JSON.search(data, '/*/sessions'), _.property('start'));
    var earliestIntoDay = _(scheduledSessions).map('start').map(minutesIntoDay).min();
    var latestIntoDay = _(scheduledSessions).map(calculateSessionEnd).map(minutesIntoDay).max();
    var daySpan = latestIntoDay - earliestIntoDay;
    var sortedSessionDays = _(scheduledSessions).sortBy('start').map(_.method('start.toDateString')).unique().value();
    var emptyDaysForDefaults = _.zipObject(sortedSessionDays, _.map(sortedSessionDays, _.constant([])));
    var byRoomSessions = _(scheduledSessions).groupBy('room.name').mapValues(function(value){
        return _(value).groupBy(_.method('start.toDateString'))
            .mapValues(function(value){
                return _.sortBy(value, 'start');
            }).defaults(emptyDaysForDefaults).value();
    }).value();

    console.log(byRoomSessions);
    container.selectAll('*').remove();

    var roomTimeTables = container.selectAll('div').data(d3.entries(byRoomSessions))
        .enter().classedDiv('room-time-table');
    roomTimeTables.classedDiv('heading').classedDiv('title').text(_.property('key'));
    var timeTables = roomTimeTables.classedDiv('time-table');
    var legendContainer = timeTables.classedDiv('legend column');
    legendContainer.classedDiv('title').text('time');
    var legendContentContainer = legendContainer.classedDiv('content');

    var baseTime = new Date(0,0,0,0,0).getTime();
    var legendIntervals = _(d3.range(earliestIntoDay, latestIntoDay, 30)).map(function(offset){
        return (
        d3.time.format('%H:%M')(new Date(baseTime + offset * 60 * 1000)) + ' - ' +
        d3.time.format('%H:%M')(new Date(baseTime + (offset + 30)* 60 * 1000)));
    }).value();
    legendContentContainer.selectAll('div.time').data(legendIntervals)
        .enter().classedDiv('time').text(_.identity);
    var dayTables = timeTables.selectAll('div.day').data(_.flow(_.property('value'), d3.entries, _.partial(sortByStringDate, 'key')))
        .enter().classedDiv('day column');
    dayTables.classedDiv('title').text(_.property('key'));
    var sessionsContainer = dayTables.classedDiv('content').selectAll('div').data(_.partial(sessionsWithGaps, earliestIntoDay, latestIntoDay))
        .enter().classedDiv('session')
        .style('flex', function(d){return d.duration + ' ' + d.duration + ' 0px';})
        .each(function(d){
            d3.select(this).style(_.get(d, 'session.style', {}));
        });
    sessionsContainer.classedDiv('session-title').text(_.property('session.name'));
    sessionsContainer.classedDiv('session-description').text(_.property('session.description'));

    // $('.session').ellipsis({setTitle: 'onEllipsis'});
    // $(document).delegate('.is-truncated', 'mouseover', function(){
    // 	console.log(arguments);
    // });
    $('.time-tables .time-table .session').dotdotdot();
    $('.is-truncated').qtip({
        content: {
            // text: 'You must have known to click me from the browser tooltip...!?'
            text: function(event){
                var data = d3.select(event.currentTarget).data();
                return (_.get(data, [0, 'session', 'description']));
            },
            title: function(event){
                var data = d3.select(event.currentTarget).data();
                return ('session: ' + _.get(data, [0, 'session', 'name']));
            },
            button: true
        },
        xcontent: function(event){
            var sessionData = _.get(d3.select(event.currentTarget).data(), [0, 'session']);
            return {
                title: sessionData.name,
                text: sessionData.description
            };
        },
        show: {
            // 	event: 'mouseover'
            solo: true
        },
        hide: {
            delay: 2000
        },
        events: {
            // show: function(rEvent, event){
            // 	var data = d3.selectAll(event.target).data();
            // 	console.log(data);
            // 	return ('session: ', _.get(data, [0, 'session', 'name']));
            // }
            // hide: function(event, api){
            // 	console.log(arguments, this);
            // 	api.target.qtip('destroy', true);
            // }
        },
        position: {
            my: 'middle left',  // Position my top left...
            at: 'middle right', // at the bottom right of...
        }
    });
}