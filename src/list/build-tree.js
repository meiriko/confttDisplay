function generateTopicsTree(rawData) {
    var data = Defiant.getSnapshot(rawData);
    var topicSessions = JSON.search(data, '/*/sessions[(./topics[(id)])]');
    var topics = _(JSON.search(data, '/*/sessions/topics[(id)]')).uniq().sortBy('id').value();
    // var noTopicSessions = JSON.search(data, '/*/sessions[not(./topics)]');
    var noTopicSessions = JSON.search(data, '/*/sessions[(./topics[not(id)])]');

    var topicsTree = _.flatten([
        _.map(topics, function (topic) {
            return {
                topic: topic,
                name: topic.name,
                sessions: _.filter(topicSessions, function (session) {
                    return _.contains(session.topics, topic);
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