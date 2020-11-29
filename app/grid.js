const axios = require('axios').default;
const helpers = require('./helpers')
let leftColumn;
let rightColumn;
const gridOrder = {
    getGrid: async () => {
        const response = await axios('https://acrlonline.org/index.php?option=com_fabrik&format=raw&task=plugin.userAjax&method=getEventDriverJSON&eventId=66&split=1');
        return response
    },
    sortGrid: (response) => {
        console.log(response.data)
        let bestTimeMs = response.data[0].pq_time;
        let timeDealtWith = response.data.map(object => {
            if (object.pq_time) {
                object.msToLeader = helpers.msToLapTime(object.pq_time - bestTimeMs, true);
                object.laptime = helpers.msToLapTime(object.pq_time)
                return object
            } else {
                object.msToLeader = ''
                object.laptime = ''
                return object;
            }
        })
        rightColumn = timeDealtWith.filter(object => object.pq % 2 === 0);
        leftColumn = timeDealtWith.filter(object => object.pq % 2 != 0);
        return {rightColumn, leftColumn}
        console.log('done')
    }
}


module.exports = gridOrder;