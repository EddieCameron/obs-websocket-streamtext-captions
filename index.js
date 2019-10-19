const request = require('request');
const OBSWebSocket = require('obs-websocket-js');

var accumText = "";
var lastCaptionSendTime
const MIN_CHAR_PER_CAPTION = 80
const MAX_SECONDS_PER_CAPTION = 4

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
        if (error != null) {
            console.error(error);
        }
        else {
            var bodyJson = JSON.parse(body);
            var next = bodyJson.lastPosition;
            if (next == 0) {
                // no data wait and try again
                console.log("No new text received. Trying again after timeout...");
                setTimeout(() => {
                    makeRequest(eventName, last);
                }, 1000);
            }
            else {
                // was successful, send text to OBS and get next
                var text = bodyJson.i[0].d;
                text = decodeURIComponent(text);
                console.log( `${last}: ${text}` )
                appendCaptionFragment(text);
                setTimeout(() => {
                    makeRequest(eventName, next);                    
                }, 500);
            }
        }
    });
}

function appendCaptionFragment(captionText) {
    for (let i = 0; i < captionText.length; i++) {
        const c = captionText[i];
        accumText += c;
        if (c == ' ') {
            // end of a word, try sending
            if (accumText.length >= MIN_CHAR_PER_CAPTION) {
                sendCaption(accumText);
                accumText = "";
            }
        }
            
    }
}

function sendCaption(captionText) {
    lastCaptionSendTime = Date.now();
    console.log("Sneding: " + captionText);
    obs.send('SendCaptions', { text: captionText })
        .then(data => {
            console.log("Captions sent: " + JSON.stringify(data));
        })
        .catch(error => {
            console.error(error);
        });
}

function checkCaptionTimeout() {
    console.log("Timeout at " + ( Date.now - lastCaptionSendTime) );
    if (Date.now - lastCaptionSendTime > MAX_SECONDS_PER_CAPTION * 1000) {
        console.log("Too long between caption updates, sending current buffer")
        sendCaption(accumText)
        accumText = "";
    }
}

var pwd = process.argv[2];
var streamTextEventName = process.argv[3];

// set up obs
const obs = new OBSWebSocket();
console.log("Connecting to OBS server...");
obs.connect({ address: 'localhost:4446', password: pwd })
    .then(() => {
        console.log("Connected to OBS")
        console.log("Connecting to StreamText...")
        
        makeRequest(streamTextEventName, 0);

        lastCaptionSendTime = Date.now();
        setInterval( checkCaptionTimeout, 1000);
    })
    .catch(err => {
        console.error(err);
    });
