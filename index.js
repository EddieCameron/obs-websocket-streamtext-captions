const request = require('request');
const OBSWebSocket = require('obs-websocket-js');

function makeRequest(eventName, last) {
    var url = `https://www.streamtext.net/text-data.ashx?event=${eventName}&last=${last}`;

    const options = {
        url: url,
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.1 Safari/605.1.15",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Connection": "keep-alive",
            "Accept-Encoding": "br, gzip, deflate",
            "Host": "www.streamtext.net"
        }
    };

    request(options, (error, res, body) => {
        if (error != nil) {
            console.error(error);
        }
        else {
            var bodyJson = JSON.parse(body);
            var next = bodyJson.lastPosition;
            if (next == 0) {
                // no data wait and try again
                setTimeout(() => {
                    makeRequest(eventName, last);
                }, 1000);
            }
            else {
                // was successful, send text to OBS and get next
                var text = bodyJson.i[0].d;
                text = decodeURIComponent(text);
                console.log( `${last}: ${text}` )
                sendCaption(text);
                makeRequest(eventName, lastPosition);
            }
        }
    });
}

function sendCaption(captionText) {
    obs.send('SendCaptions', { text: captionText });
}

var pwd = process.argv[2];
var streamTextEventName = process.argv[3];

// set up obs
const obs = new OBSWebSocket();
console.log("Connecting to OBS server...");
obs.connect({ address: 'localhost:4444', password: pwd })
    .then(() => {
        console.log("Connected to OBS")
        console.log("Connecting to StreamText...")
        
        makeRequest(streamTextEventName, 0);
    })
    .catch(err => {
        console.error(err);
    });
