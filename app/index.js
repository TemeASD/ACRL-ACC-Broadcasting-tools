const dgram = require('dgram');
const api = require('./api');
const constants = require('./constants');
const binutils = require('binutils');
const helpers = require('./helpers');
const jsonWriter = require('./writeJson')
const entrylist = require('./entrylist');

const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
const mustacheExpress = require('mustache-express');
const gridOrder = require('./grid');
const events = require('events');
const cars = require('./cars')
/*USER DEFINED CONSTANTS */
const cfg = require('config');
const HTTP_PORT = cgf.HTTP_PORT;
const SOCKETIO_PORT = cfg.SOCKETIO_PORT;
const HOST = cfg.ACC_IP_HOST;
const LISTENER_UDP = cfg.LISTENER_UDP;
const ACC_UDP_PORT = cfg.ACC_UDP_PORT;
const DISPLAY_NAME = cfg.DISPLAY_NAME;
const CONNECTION_PASSWORD = cfg.CONNECTION_PASSWORD;
const COMMAND_PASSWORD = cfg.COMMAND_PASSWORD;

/*SHIT VARIABLES THAT SUCK DICK HERE */

let globalRealtimeTick = {}
const onClientConnectedCallback = (callback) => {
    console.log(`I'm connected to ACC!`, callback);
}

/*HTTP PART :D */
server.listen(SOCKETIO_PORT)

app.use(express.static('./'))
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', __dirname + '/views/');
app.get('/starting-grid', (req, res) => {
    gridOrder.getGrid()
        .then(response => {
            let jsons = gridOrder.sortGrid(response);
            res.render('pqresults', jsons);
        })
})

app.get('/sm-conditions', (req, res) => {
    res.render('conditions_small');
})

app.get('/fastest-lap', (req, res) => {
    res.render('fastest_lap')
})
app.get('/fastest-lap/test', (req, res) => {
    res.render('fastest_lap_test')
})

app.listen(HTTP_PORT, () => {
    console.log(`Webserver at http://localhost:${HTTP_PORT}`);
})
/*EVENT EMITER FOR FASTEST LAPS*/
let fl = new events.EventEmitter();

/*--------*/
/*SOCKET.IO PART*/
/*--------*/
function getConditions() {
    let obj = {}
    try {
        obj.trackTemp = globalRealtimeTick.trackTemp
        obj.ambientTemp = globalRealtimeTick.ambientTemp
        obj.clouds = globalRealtimeTick.clouds
        obj.rainLevel = globalRealtimeTick.rainLevel
        obj.wetness = globalRealtimeTick.wetness
        return obj;
    } catch (err) {
        console.log(err)
    }
}
io.origins('*:*')
io.sockets.on('connection', (socket) => {
    console.log('connect')
    socket.emit(getConditions());

    socket.on('update', data => {
        console.log('got updaterequest')
        io.sockets.emit('update', getConditions());
    })
    fl.on('FastestLap', data => {
        io.sockets.emit('fastest_lap_update', data)
    })
});

/*--------*/
/*ACC PART*/
/*--------*/
const acc = dgram.createSocket('udp4');
acc.bind(ACC_UDP_PORT);
reqRes = {}
/*UPDATE ENTRY LIST PERIODICALLY*/
setInterval(() => {
    requestEntryList(reqRes.connectionIdentifier);
}, 450000);

acc.on('message', message => {

    //console.log(`raw message: ${message}`);
    const reader = new binutils.BinaryReader(message, 'little');
    const messageType = reader.ReadUInt8();
    switch (messageType) {
        case constants.InboundMessageTypes.REGISTRATION_RESULT: {
            try {
                console.log('REGISTRATION_RESULT');
                const connectionIdentifier = reader.ReadInt32();
                const connectionSuccess = reader.ReadBytes(1).readUInt8(0) > 0;
                const isReadonly = reader.ReadBytes(1).readUInt8(0) === 0;
                const errMsg = helpers.readString(reader);

                reqRes = { connectionIdentifier, connectionSuccess, isReadonly, errMsg }
                // If registeration succeed, ask for entrylist and track data
                requestTrackData(connectionIdentifier);
                requestEntryList(connectionIdentifier);

                break;
            } catch (error) {
                console.log(error)
                break;

            }
        }
        case constants.InboundMessageTypes.ENTRY_LIST: {
            try {
                console.log('ENTRY_LIST');
                const someconid = reader.ReadInt32();
                const carEntryCount = reader.ReadUInt16();
                console.log(carEntryCount, 'car entry count');
                for (let i = 0; i < carEntryCount; i++) {
                    entrylist.addCar(reader.ReadUInt16());
                }
            } catch (error) {
                console.log(error)
                break;

            }
        }
        case constants.InboundMessageTypes.ENTRY_LIST_CAR: {
            try {
                const reader = new binutils.BinaryReader(message, 'little');
                const messageType = reader.ReadUInt8();
                entryListCar = {}
                entryListCar.carId = reader.ReadUInt16();

                entryListCar.carModelType = reader.ReadBytes(1).readInt8(0); // Byte sized car model
                entryListCar.carModel = cars[entryListCar.carModelType].model;
                entryListCar.carclass = cars[entryListCar.carModelType].class;
                entryListCar.teamName = helpers.readString(reader);
                entryListCar.raceNumber = reader.ReadInt32();
                entryListCar.cupCategory = reader.ReadBytes(1).readInt8(0);
                entryListCar.currentDriverIndex = reader.ReadBytes(1).readInt8(0);
                entryListCar.nationality = reader.ReadUInt16();
                entryListCar.drivers = []
                // Now the drivers on this car:
                let driversOnCarCount = reader.ReadBytes(1).readInt8(0);

                for (let di = 0; di < driversOnCarCount; di++) {

                    let driverInfo = {};
                    driverInfo.firstName = helpers.readString(reader);
                    driverInfo.lastName = helpers.readString(reader);
                    driverInfo.shortName = helpers.readString(reader);
                    driverInfo.category = reader.ReadBytes(1).readUInt8(0)
                    driverInfo.Nationality = reader.ReadUInt16();
                    entryListCar.drivers.push(driverInfo)
                }
                entrylist.addCar(entryListCar)
                //console.log(entryListCar);
            } catch (error) {
                console.log(error)
                break;
            }
        }
        case constants.InboundMessageTypes.REALTIME_UPDATE: {

            let waitOnce = false
            let timeOutMs = 10000;
            if (waitOnce) { timeOutMs = 5 }
            try {

                setTimeout(() => {
                    //console.log('REALTIME_UPDATE');
                    try {
                        const reader2 = new binutils.BinaryReader(message, 'little');
                        const messageType = reader2.ReadUInt8();

                        waitOnce = true
                        realtimeTick = {}
                        realtimeTick.eventIndex = reader2.ReadUInt16();
                        realtimeTick.sessionIndex = reader2.ReadUInt16();
                        realtimeTick.sessionType = reader2.ReadBytes(1).readUInt8(0);
                        realtimeTick.phase = reader2.ReadBytes(1).readUInt8(0);
                        realtimeTick.sessionTime = reader2.ReadFloat();
                        realtimeTick.sessionEndTime = reader2.ReadFloat();
                        realtimeTick.focusedCarIndex = reader2.ReadInt32();
                        realtimeTick.activeCameraSet = helpers.readString(reader2);
                        realtimeTick.activeCamera = helpers.readString(reader2);
                        realtimeTick.currentHudPage = helpers.readString(reader2);

                        realtimeTick.isReplayPlaying = reader2.ReadBytes(1) > 0;
                        if (realtimeTick.isReplayPlaying) {
                            realtimeTick.replaySessionTime = reader2.ReadFloat();
                            realtimeTick.replayRemainingTime = reader2.ReadFloat();
                        }

                        realtimeTick.timeOfDay = reader2.ReadFloat();
                        realtimeTick.timeOfDay = helpers.humanReadabletimeOfDay(realtimeTick.timeOfDay);
                        realtimeTick.ambientTemp = reader2.ReadBytes(1).readUInt8();
                        realtimeTick.trackTemp = reader2.ReadBytes(1).readUInt8();
                        realtimeTick.clouds = reader2.ReadBytes(1).readUInt8() / 10;
                        realtimeTick.rainLevel = reader2.ReadBytes(1).readUInt8() / 10;
                        realtimeTick.wetness = reader2.ReadBytes(1).readUInt8() / 10;
                        realtimeTick.sessionBestLap = helpers.readLap(reader2);
                        let bestLap = helpers.newBestLapTime(realtimeTick.sessionBestLap)
                        console.log('clouds: ', realtimeTick.clouds, 'wetness: ',realtimeTick.wetness, 'rain: ', realtimeTick.rainLevel);
                        if (bestLap != undefined) {
                            fl.emit('FastestLap', bestLap)
                        }
                        //jsonWriter.writeConditionsToFile(realtimeTick);
                        globalRealtimeTick = realtimeTick;

                    } catch (error) {
                        console.log(error);
                    }
                }, timeOutMs);
            } catch (err) {
                console.log(err);
            }
            break;
        }
        case constants.InboundMessageTypes.TRACK_DATA: {
            //console.log('TRACK_DATA');

            const reader = new binutils.BinaryReader(message, 'little');
            const messageType = reader.ReadUInt8();
            const connectionId = reader.ReadInt32();
            const trackName = helpers.readString(reader);
            const trackId = reader.ReadInt32();
            const trackMeters = reader.ReadInt32();

            console.log('trackdata: ', { connectionId, trackMeters, trackId, trackName });
        }
        case constants.InboundMessageTypes.REALTIME_CAR_UPDATE: {
            try {
                let waitOnce = false
                let timeOutMs = 10000;
                if (!waitOnce) { waitOnce = true, timeOutMs = 10 }

                setTimeout(() => {
                    waitOnce = true;
                    realtimeCarUpdateTick = {}
                    realtimeCarUpdateTick.carIndex = reader.ReadUInt16();
                    realtimeCarUpdateTick.driverIndex = reader.ReadUInt16();
                    realtimeCarUpdateTick.driverCount = reader.ReadBytes(1).readUInt8(0);
                    realtimeCarUpdateTick.gear = reader.ReadBytes(1).readUInt8(0) - 2;
                    realtimeCarUpdateTick.worldPosX = reader.ReadFloat();
                    realtimeCarUpdateTick.worldPosY = reader.ReadFloat();
                    realtimeCarUpdateTick.yaw = reader.ReadFloat();
                    realtimeCarUpdateTick.carLocation = reader.ReadBytes(1).readUInt8(0);
                    realtimeCarUpdateTick.kmh = reader.ReadUInt16();
                    realtimeCarUpdateTick.position = reader.ReadUInt16();
                    realtimeCarUpdateTick.cupPosition = reader.ReadUInt16();
                    realtimeCarUpdateTick.trackPosition = reader.ReadUInt16();
                    realtimeCarUpdateTick.splinePosition = reader.ReadFloat();
                    realtimeCarUpdateTick.laps = reader.ReadUInt16();

                    const delta = reader.ReadUInt32();
                    realtimeCarUpdateTick.BestSessionLap = helpers.readLap(reader);
                    realtimeCarUpdateTick.LastLap = helpers.readLap(reader);
                    realtimeCarUpdateTick.CurrentLap = helpers.readLap(reader);

                    //console.log({carIndex, driverIndex, gear, kmh, laps, delta});
                    //console.log(realtimeCarUpdateTick)
                }, timeOutMs)
            } catch {
                console.log(error);
                break;
            }
            break;
        }
        case constants.InboundMessageTypes.BROADCASTING_EVENT: {
            console.log('BROADCASTING_EVENT')
            break;
        }
        default: {
            console.log('response message type not recognized', messageType);
        }
    }
});

acc.on('listening', () => {
    const address = acc.address();
});


function handleError(err) {
    if (err) {
        console.log('ERROR');
        console.log(err);
    }
}


const requestConnection = api.requestConnection(DISPLAY_NAME, CONNECTION_PASSWORD, COMMAND_PASSWORD);
const connection = acc.send(requestConnection, 0, requestConnection.length, LISTENER_UDP, HOST, handleError);

function requestTrackData(connectionIdentifier) {
    console.log(connectionIdentifier, 'requestTrackData')
    const requestTrackData = api.requestTrackData(connectionIdentifier);
    acc.send(requestTrackData, 0, requestTrackData.length, LISTENER_UDP, HOST, () => {
        console.log('sent request for trackdata');
    });

}

function requestEntryList(connectionIdentifier) {
    console.log(connectionIdentifier, 'requestEntryList')
    const requestEntryList = api.requestEntryList(connectionIdentifier);
    acc.send(requestEntryList, 0, requestEntryList.length, LISTENER_UDP, HOST, () => {
        console.log('sent request for entrylist');
    });
}

