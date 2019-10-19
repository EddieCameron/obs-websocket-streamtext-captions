
// obs-websocket-streamtext
// Simple tool to feed StreamText data into OBS (via obs-websockets) so you can do live closed captioning in Twitch

// install:
// 1. run "npm install" in command line or terminal or bash
// 2. in OBS, go to Tools > Options > Captions (Experimental) and enable captions on a muted sound source
// 3. download and install obs-websockets plugin for OBS, and activate it (Tools > Options > WebSockets Server Settings)

// usage:
// run "node index [address:port] [password] [streamtext_event]" (e.g. "node index localhost:4444 myPassword IHaveADream")
// (or edit the provided .bat file in a text editor to do it for you)

const request = require('request');
const OBSWebSocket = require('obs-websocket-js');

var accumText = "";
var lastCaptionSendTime
const MIN_CHAR_PER_CAPTION = 80
const MAX_SECONDS_PER_CAPTION = 6

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
                // console.log( `${last}: ${text}` )
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
    console.log(">>> " + captionText);
    obs.send('SendCaptions', { text: captionText })
        .then(data => {
            // console.log("Captions sent: " + JSON.stringify(data));
        })
        .catch(error => {
            console.error(error);
        });
}

function checkCaptionTimeout() {
    // console.log("Timeout at " + ( Date.now() - lastCaptionSendTime) );
    console.log("..." );
    if (Date.now() - lastCaptionSendTime > MAX_SECONDS_PER_CAPTION * 1000) {
        console.log("Too long between caption updates, sending current buffer!...")
        sendCaption(accumText)
        accumText = "";
    }
}

var adr = process.argv[2];
var pwd = process.argv[3];
var streamTextEventName = process.argv[4];

// set up obs
const obs = new OBSWebSocket();
console.log("Connecting to OBS server... ");
obs.connect({ address: adr, password: pwd })
    .then(() => {
        console.log("Connected to OBS WebSockets server at " + adr);
        console.log("Connecting to StreamText event " + streamTextEventName);
        
        makeRequest(streamTextEventName, 0);

        lastCaptionSendTime = Date.now();
        setInterval( checkCaptionTimeout, 1000);
    })
    .catch(err => {
        console.error(err);
    });
