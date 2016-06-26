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
        .enter().classedDiv('talk');
    var talksHeading = talksContainer.classedDiv('heading');
    talksHeading.classedDiv('title').text(_.property('name'));
    talksHeading.classedDiv('schedule').text(formatTalkDuration);
    talksContainer.classedDiv('speakers').selectAll('div').data(_.property('speakers'))
        .enter().classedDiv('speaker').text(_.property('name'));
    var talksContent = talksContainer.classedDiv('content');
    talksContent.selectAll('div').data(_.flow(_.property('abstract'), Array.of, _.compact))
        .enter().classedDiv('abstract').text(_.identity);

}
