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