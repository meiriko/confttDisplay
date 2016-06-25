function formatSessionTime(session){
    return (
            session.start ? d3.time.format('%x ')(session.start) : '' ) +
        formatDuration(session.start, session.duration || session.end);
}
