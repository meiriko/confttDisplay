/**
 * Created by meir on 6/25/2016.
 */

!function(){
  var confttDisplay = {
    version: "0.9.0",
    buildTopicsList: buildTopicsList,
    buildRoomsTimeTable: buildRoomsTimeTable,
    buildDaysTimeTable: buildDaysTimeTable,
    tabifyTable: tabifyTable
  }; // semver

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
function formatSessionTime(session){
    return (
            session.time ? d3.time.format('%x ')(session.time) : '' ) +
        formatDuration(session.time, session.duration || session.end);
}
function formatTalkDuration(talk, index, extraOffset){
    var parentData = _.first(d3.selectAll($(this).closest('.session')).data());
    if(parentData){
        var offset = _(parentData.talks).take(index).sum('duration') + (extraOffset || 0);
        return formatDuration(parentData.time && new Date(parentData.time.getTime() + offset * 60000), talk.duration);
    }
}
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
function buildTopicsList(selector, rawData) {
    var container = d3.select(selector);
    container.selectAll('*').remove();
    var tree = generateTopicsTree(rawData);
    var topicContainer = container.selectAll('div').data(tree).enter()
        .classedDiv('topic');
    topicContainer.classedDiv('title').text(_.property('name'));
    var sessionsContainer = topicContainer.classedDiv('sessions')
        .selectAll('div').data(_.property('sessions')).enter()
        .classedDiv('session');
    var sessionsHeading = sessionsContainer.classedDiv('heading');
    sessionsHeading.classedDiv('title').text(_.property('name'));
    sessionsHeading.classedDiv('schedule').text(formatSessionTime);
    sessionsContainer.classedDiv('chair-persons').selectAll('div').data(_.property('chairPersons'))
        .enter().classedDiv('chair-person').text(_.property('name'));

    var talksContainer = sessionsContainer.classedDiv('talks').selectAll('div').data(_.property('talks'))
        .enter().append(function(d){
            var className = 'talk'
            if(_.has(d, 'pro')){
                className += ' debate';
            }
            var debate = d3.select(this).classedDiv(className);
            return debate.node();
        });
    talksContainer.call(buildTalkContent);
    talksContainer.each(function(d){
        var debate = d3.select(this);
        if(_.has(d, 'pro')){
            debate.selectAll('.talk .pro').data([d.pro]).enter().classedDiv('talk pro');
        }
        if(_.has(d, 'con')){
            debate.selectAll('.talk .con').data([d.con]).enter().classedDiv('talk con');
        }
        debate.selectAll('.talk.pro').call(buildTalkContent, 'pro');
        debate.selectAll('.talk.con').call(buildTalkContent, 'con', _.get(d, 'pro.duration', 0));
    });
}
function generateTopicsTree(rawData) {
    var data = Defiant.getSnapshot(rawData);
    var topicSessions = JSON.search(data, '/*/sessions[(./topics[(id)])]');
    var topics = _(JSON.search(data, '/*/sessions/topics[(id)]')).uniq(_.property('id')).sortBy('id').value();
    // var noTopicSessions = JSON.search(data, '/*/sessions[not(./topics)]');
    var noTopicSessions = JSON.search(data, '/*/sessions[(./topics[not(id)])]');
    _.each(topicSessions, function(session){
        if(session.time && !_.isDate(session.time)){
            session.time = new Date(session.time);
        }
    });
    _.each(noTopicSessions, function(session){
        if(session.time && !_.isDate(session.time)){
            session.time = new Date(session.time);
        }
    });

    var topicsTree = _.flatten([
        _.map(topics, function (topic) {
            return {
                topic: topic,
                name: topic.name,
                sessions: _.filter(topicSessions, function (session) {
                    return _.find(session.topics, topic);
                })
            }
        }),
        _.map(noTopicSessions, function (session) {
            return {
                name: session.name,
                sessions: [session]
            }
        })
    ]);
    return (topicsTree);
}
function buildTalkContent(talksContainer, debateSection, debateOffset){
    var talksHeading = talksContainer.classedDiv('heading');
    talksHeading.classedDiv('title').text(debateSection || _.property('name'));
    var durationFormatter = (debateOffset ? _.partial(formatTalkDuration, _, _, debateOffset) : formatTalkDuration);
    talksHeading.classedDiv('schedule').text(durationFormatter);
    talksContainer.classedDiv('speakers').selectAll('div').data(_.property('speakers'))
        .enter().classedDiv('speaker').text(_.property('name'));
    var talksContent = talksContainer.classedDiv('content');
    talksContent.selectAll('div').data(_.flow(_.property('abstract'), Array.of, _.compact))
        .enter().classedDiv('abstract').text(_.identity);
}
function sessionToDuration(session){
    var result = {start: session.time};
    var end = (session.duration || session.end);
    if(end){
        result.end = _.isDate(end) ? end: new Date(session.time.getTime() + end * 60000);
    } else {
        result.end = session.time;
    }
    return result;
}

function calculateSessionEnd(session){
    var end = (session.duration || session.end || session.time);
    return (_.isDate(end) ? end: new Date(session.time.getTime() + end * 60000));
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
function sessionsWithGaps(start, end, sessionWrapper){
    var sessions = _.map(sessionWrapper.value, function(session){
        return {
            start: minutesIntoDay(session.time) - start,
            end: calculateSessionEndIntoDay(session) -  start,
            session: session
        };
    });
    var breaks = _([0, _.map(sessions, function(session){
        return [session.start, session.end];
    }), end - start]).flattenDeep().chunk(2).reject(_.spread(_.eq))
        .map(_.partial(_.zipObject,['start', 'end'])).value();
    var schedule = _([sessions, breaks]).flatten().sortBy('start').each(function(item){
        item.duration = item.end - item.start;
    }).value();
    return (schedule);
}
function sortByStringDate(key, array){
    return _.sortBy(array, function(item){
        return (new Date(_.get(item, key)));
    });
}
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
        .enter().classedDiv('titled-time-table');
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
        .enter().classedDiv('data column');
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
function truncate(selector, container){
    $(selector).find('.time-table .session').dotdotdot();
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
            viewport: $(container.node()),
            adjust: {
                method: 'flipinvert'
            },
            my: 'middle left',
            at: 'middle right'
        }
    });
}
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

function toggleTables(tables, event){
    if(this.value < 0){
        tables.css('display', 'inherit');
    } else {
        tables.css('display', 'none');
        tables.eq(this.value).css('display', 'inherit');
    }
}
function toggleSections(tables, event){
    var index = this.value;
    tables.each(function(){
        var sections = $(this).find('.data.column');
        if(index < 0) {
            sections.css('display', 'inherit')
        } else {
            sections.css('display', 'none')
            sections.eq(index).css('display', 'inherit');
        }
    });
}

  if (typeof define === "function" && define.amd) this.confttDisplay = confttDisplay, define(confttDisplay);
  else if (typeof module === "object" && module.exports) module.exports = confttDisplay;
  else this.confttDisplay = confttDisplay;
}();
