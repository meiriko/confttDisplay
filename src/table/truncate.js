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
