
const fs = require('fs')

/* 
Write conditions to a file, overwrites the old file 
conditions:
    windDir: 
    ambientTemp
    trackTemp
    trackGrip
    - new values
    wetness
    timeOfDay
    clouds

*/
const jsonWriter = {

    writeConditionsToFile: (data) => {
        let templateString =
            `{"conditions":{"ambientTemp":"${data.ambientTemp} C","trackTemp":"${data.trackTemp} C","trackGrip":"${data.trackGrip}", "wetness": "${data.wetness}", "timeOfDay":"${data.timeOfDay}", "clouds":"${data.clouds}", "sessionBestLap": "${data.sessionBestLap}"}}
`   
        console.log(data);
        console.log(templateString);
        fs.writeFileSync('../frontend/conditions.json', templateString, err => {
            if (err) {
                console.log('Error writing file', err)
            } else {
                console.log('Successfully wrote file')
            }
        })
    },
    writeRaceStateToFile: (data) => {
        console.log('data has arrived')
        console.log(data)
    }

};

module.exports = jsonWriter;