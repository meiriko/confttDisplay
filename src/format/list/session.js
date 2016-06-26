function formatSessionTime(session){
    return (
            session.time ? d3.time.format('%x ')(session.time) : '' ) +
        formatDuration(session.time, session.duration || session.end);
}
