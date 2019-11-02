# obs-websocket-streamtext-captions
NodeJS tool to feed live [StreamText](https://streamtext.net/) caption data into [Open Broadcaster Software (OBS)](https://obsproject.com/), so it can format captions into EIA-608 spec for [Twitch closed captioning](https://help.twitch.tv/s/article/guide-to-closed-captions?language=en_US). If you don't use this, you basically have to roll your own media encoder tech stack (Wowza, etc) or buy an expensive hardware caption encoder.

## install
1. download and install [NodeJS](https://nodejs.org/en/download/) on your OBS computer
2. download or clone this repo, open the folder in command line / terminal / bash, and run `npm install`
3. in OBS, go to **Tools > Options > Captions (Experimental)** and enable captions on a muted audio source via speech-to-text (don't worry, those bad captions will get overridden by this tool)
4. download and install [obs-websocket](https://github.com/Palakis/obs-websocket) plugin, and activate it via **Tools > Options > WebSockets Server Settings**
    - this is also when you set your port and password

## usage
- during your broadcast, open your obs-websocket-streamtext-captions folder in terminal / command line / bash
    - in terminal / command line / bash, run `node index -a [obs address:port] -p [obs password] -e [streamtext_event]
        - if you run NodeJS on the same computer as OBS, then you can use "localhost" as your address
        - example: `node index -a localhost:4444 -p myPassword`-e IHaveADream
- (Windows) OR, edit the provided .bat file in a text editor, and then double-click on it

## how it works / workflow / pipeline
1. hire a human stenographer / live captioner / CART provider to type out captions, really really fast, into StreamText
2. this tool takes the StreamText data and sends it into OBS
    - it collects recent StreamText data into a buffer, then waits until the buffer fills up (default: 80 characters) or StreamText times out (default: 5 seconds) while trying to line break the text between words (instead of line breaking in the middle of a word)
    - then it sends the caption buffer into the OBS WebSocket Server via [SendCaptions protocol](https://github.com/Palakis/obs-websocket/blob/4.x-current/docs/generated/protocol.md#sendcaptions)
3. OBS uses [libcaption](https://github.com/szatmary/libcaption) (already bundled with OBS) to encode its caption text into EIA-608 format to embed into the RMTP data stream (see [Twitch's requirements for closed caption data](https://help.twitch.tv/s/article/guide-to-closed-captions?language=en_US) )
4. Twitch's media servers ingest the video feed / caption data, and then it hopefully enables the closed caption feature for your viewers, there's often some delay before it wakes up

If you can't afford / don't want to hire a human live captioner, there are already automatic tools like [Web Captioner](https://webcaptioner.com/) that can easily hook into OBS, but provide substandard captions (can't spell names or specialized vocabulary, no punctuation). 

This tool is specifically for Twitch broadcasts to provide closed captions via human live captioners through StreamText (a common captioning service).

## contributors / updates
- aside from tweaks and bug fixes, this is mostly done
- if you know C or C++, then you should make an OBS Plugin that does the same thing this does, without the need to install NodeJS

## open captions vs closed captions
- "open captions" are always on, and burned directly into the video feed ... they cannot be turned off
- "closed captions" are optional and usually more accessible (user can customize caption appearance, better compatibility with screen reader software, etc.)
- this tool is for offering closed captions

## acknowledgments
- uses [obs-websocket-js](https://github.com/haganbmj/obs-websocket-js)
- talks to [obs-websocket](https://github.com/Palakis/obs-websocket)
