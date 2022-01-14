export type loopType = 'count' | 'side'

export default Object.freeze({

    TRACK_COUNT : 8,
    INITIAL_TRACK_VOLUME : 100, // percent
    MAX_TRACK_VOLUME : 200, // percent

    LOOP_INFO_TYPE : 'count' as loopType, // "side" or "count" define wich information is display inside loop circle.

    RECORDING_FORMAT: 'mp3', // https://github.com/higuma/web-audio-recorder-js#Methods
    RECORDING_MAX_TIME: 300, // MAx record duration (second)

    VUMETTER_CANVAS_WIDTH : 1, // Full width with css
    VUMETTER_CANVAS_HEIGHT : 300,
    VUMETTER_RATIO : 4
})
