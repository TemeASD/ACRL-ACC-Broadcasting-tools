/*
function readString(reader) {
    const length = reader.ReadUInt16();
    const bytes = reader.ReadBytes(length)
    return new TextDecoder().decode(bytes);
}
*/
const enums = require('./broadcastingEnums');
const moment = require('moment')
const entrylist = require('./entrylist');
const longestValidTime = 200000;
const shortestValidTime = 80000;
let curFastestLap = longestValidTime;
let bestLapRetObj = {}
const helpers = {

    readString: (reader) => {
        const length = reader.ReadUInt16();
        const bytes = reader.ReadBytes(length);
        return bytes.toString('utf8');
    },
    readLap: (reader) => {
        let lap = {
            splits: []
        };
        lap.laptimeMs = reader.ReadInt32();
        lap.carIndex = reader.ReadUInt16();
        lap.driverIndex = reader.ReadUInt16();

        const splitCount = reader.ReadBytes(1);
        //sanity check
        //console.log(splitCount);
        for (let i = 0; i < splitCount; i++) {
            let split = reader.ReadInt32();
            //console.log(split, 'split', i)
            lap.splits.push(split);
        }
        lap.isInvalid = reader.ReadBytes(1) > 0;
        lap.isValidForBest = reader.ReadBytes(1) > 0;

        const isOutlap = reader.ReadBytes(1) > 0;
        const isInlap = reader.ReadBytes(1) > 0;

        if (isOutlap) {
            lap.Type = enums.lapType.Outlap;
            //console.log(lap.Type)
        }
        else if (isInlap) {
            lap.Type = enums.lapType.Inlap;
            //console.log(lap.Type)
        }
        else {
            lap.Type = enums.lapType.Regular;
            //console.log(lap.Type)
        }
        // Now it's possible that this is "no" lap that doesn't even include a 
        // first split, we can detect this by comparing with int32.Max
        /* while (lap.splits.length < 3)
        {
            lap.splits = [];
        }*/
        return lap;
    },
    humanReadabletimeOfDay: (duration) => {
        let hours = moment.duration(duration, "seconds").hours();
        let minutes = moment.duration(duration, "seconds").minutes();
        if (hours < 10) {
            hours = "0" + hours.toString();
        }
        if (minutes < 10) {
            minutes = "0" + minutes.toString();
        }
        return `${hours}:${minutes}`
    },
    /**
     * Returns an object with the fastest laptime and the details of that time
     * Example:
     * laptimeMs: 84117,
     * laptimeHr: '1:24.117',
     * teamName: 'Black Falcon',
     * driver: 'Luca Stolz',
     * carNumber: 4
     */
    newBestLapTime: (laptime) => {
        if (laptime.laptimeMs > shortestValidTime && laptime.laptimeMs < longestValidTime && laptime.Type == 2) {
            if(curFastestLap > laptime.laptimeMs && !laptime.isInvalid) {
                console.log('faster: ', curFastestLap, laptime.laptimeMs);
                console.log('do shit')
                curFastestLap = laptime.laptimeMs;
                let car = entrylist.getCarById(laptime.carIndex);

                bestLapRetObj.laptimeMs = laptime.laptimeMs;
                bestLapRetObj.laptimeHr = helpers.msToLapTime(laptime.laptimeMs)
                bestLapRetObj.teamName = car.teamName;
                bestLapRetObj.driver = `${car.drivers[laptime.driverIndex].firstName} ${car.drivers[laptime.driverIndex].lastName}`
                bestLapRetObj.carNumber = car.raceNumber;

                return bestLapRetObj
            }   
        }
        return undefined;
    },

    msToLapTime: (ms, differenceToLeader) => {
        let mins = (ms / 1000) / 60;
        let secs = ((ms / 1000) % 60).toFixed(3);
        let secsSplit = secs.toString().split(".")
        let millis = secsSplit[1];
        secs = secsSplit[0];
        if (mins > 1) {
            mins = Math.floor(mins);
        } else {
            mins = 0;
        }
        if (!differenceToLeader) {
            if (secs < 10) {
                secs = "0" + secs;
            }
            return mins + ":" + secs + "." + millis;
        }
        return + secs + "." + millis;
    }
}
module.exports = helpers;

