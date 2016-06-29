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
