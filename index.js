
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
var argv = require('yargs')
    .usage('Usage: $0 [-a <obs_address> -p <obs_password>] -e <StreamText event name>')
    .options({
        'eventname': {
            alias: 'e',
            describe: "Name of StreamText event eg: 'IHaveADream'",
            demandOption: true,
            nargs: 1
        },
        'obsaddress': {
            alias: 'a',
            describe: "Address of OBS server to connect to",
            implies: 'obspassword',
            nargs: 1
        },
        'obspassword': {
            alias: 'p',
            describe: "Password to connect to OBS server",
            implies: 'obsaddress',
            nargs: 1
        }
    })
    .help( false )
    .argv;

var accumText = "";
var lastCaptionSendTime
const MIN_CHAR_PER_CAPTION = 80
const MAX_SECONDS_PER_CAPTION = 6

var isObsConnected = false

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
            console.log("Error getting text. Trying again after timeout...");
            setTimeout(() => {
                makeRequest(eventName, last);
            }, 1000);
        }
        else {
            var bodyJson = JSON.parse(body);
            if (bodyJson.hasOwnProperty("i") && bodyJson.i.length > 0) {
                // was successful, send text to OBS and get next
                bodyJson.i.forEach(element => {
                    var text = element.d;
                    text = decodeURIComponent(text);
                    
                    // console.log( `${last}: ${text}` )
                    appendCaptionFragment(text);
                });

                var newLast = res.headers['l_p']
                setTimeout(() => {
                    makeRequest(eventName, newLast);                    
                }, 500);
                
            }
            else {
                // no data wait and try again
                console.log("No new text received. Trying again after timeout...");
                setTimeout(() => {
                    makeRequest(eventName, last);
                }, 1000);
            }
        }
    });
}

function appendCaptionFragment(captionText) {
    console.log("adding text " + captionText);
    for (let i = 0; i < captionText.length; i++) {
        const c = captionText[i];
        if (c == '\b') {
            // backspace
            if (accumText.length > 0)
                accumText = accumText.slice(0, accumText.length - 1);
        }
        else {
            accumText += c;
            if (c == ' ') {
                // end of a word, try sending
                if (accumText.length >= MIN_CHAR_PER_CAPTION) {
                    sendAccummulatedCaption();
                }
            }
        }   
    }
}

function sendAccummulatedCaption() {
    if (!isObsConnected)
        return;
    
    lastCaptionSendTime = Date.now();

    sendTextToObs(accumText);
    accumText = "";
}

function sendTextToObs(sendingText) {
    console.log(">>> " + sendingText);
    obs.send('SendCaptions', { text: sendingText })
        .then(data => {
            // console.log("Captions sent: " + JSON.stringify(data));
        })
        .catch(error => {
            console.error(error);
            // try again
            setTimeout(() => {
                sendTextToObs(sendingText);
            }, 2000);
        });
}

function checkCaptionTimeout() {
    // console.log("Timeout at " + ( Date.now() - lastCaptionSendTime) );
    console.log("..." );
    if (Date.now() - lastCaptionSendTime > MAX_SECONDS_PER_CAPTION * 1000) {
        console.log("Too long between caption updates, sending current buffer!...")
        sendAccummulatedCaption()
    }
}

// set up obs
if (argv.obsaddress != undefined) {
    const obs = new OBSWebSocket();
    console.log("Connecting to OBS server... ");
    obs.connect({ address: argv.obsaddress, password: argv.obspassword })
        .then(() => {
            console.log("Connected to OBS WebSockets server at " + adr);
            isObsConnected = true;

            lastCaptionSendTime = Date.now();
            setInterval(checkCaptionTimeout, 1000);
        })
        .catch(err => {
            console.error(err);
        });
}

console.log("Connecting to StreamText event " + argv.eventname);
makeRequest(argv.eventname, 0);
