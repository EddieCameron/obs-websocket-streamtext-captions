# obs-websocket-streamtext-captions
NodeJS tool to feed live [StreamText](https://streamtext.net/) caption data into [Open Broadcaster Software (OBS)](https://obsproject.com/) version 28 and higher, so it can format captions into EIA-608 spec for [Twitch closed captioning](https://help.twitch.tv/s/article/guide-to-closed-captions?language=en_US). If you don't use this, you basically have to roll your own media encoder tech stack (Wowza, etc) or buy an expensive hardware caption encoder.

## install
1. download and install [NodeJS](https://nodejs.org/en/download/) on your OBS computer
2. download or clone this repo, open the folder in command line / terminal / bash, and run `yarn install` followed by `yarn build`.

## usage
- during your broadcast, open your obs-websocket-streamtext-captions folder in terminal / command line / bash
    - in terminal / command line / bash, run `yarn transcribe -a ws:[obs address:port] -p [obs password] -e [streamtext_event]
        - if you run NodeJS on the same computer as OBS, then you can use "localhost" as your address
        - example: `yarn transcribe -a ws:localhost:4455 -p myPassword -e IHaveADream`

## how it works / workflow / pipeline
1. hire a human stenographer / live captioner / CART provider to type out captions, really really fast, into StreamText
2. this tool takes the StreamText data and sends it into OBS
    - it collects recent StreamText data into a buffer, then waits until the buffer fills up (default: 80 characters) or StreamText times out (default: 5 seconds) while trying to line break the text between words (instead of line breaking in the middle of a word)
    - then it sends the caption buffer into the OBS WebSocket Server via [SendStreamCaption protocol](https://github.com/obsproject/obs-websocket/blob/release/5.0.0/docs/generated/protocol.md#sendstreamcaption)
3. OBS uses [libcaption](https://github.com/szatmary/libcaption) (already bundled with OBS) to encode its caption text into EIA-608 format to embed into the RMTP data stream (see [Twitch's requirements for closed caption data](https://help.twitch.tv/s/article/guide-to-closed-captions?language=en_US) )
4. Twitch's media servers ingest the video feed / caption data, and then it hopefully enables the closed caption feature for your viewers, there's often some delay before it wakes up

If you can't afford / don't want to hire a human live captioner, there are already automatic tools like [Web Captioner](https://webcaptioner.com/) that can easily hook into OBS, but provide substandard captions (can't spell names or specialized vocabulary, no punctuation). 

This tool is specifically for Twitch broadcasts to provide closed captions via human live captioners through StreamText (a common captioning service).

## contributors / updates
- [lizthegrey](https://github.com/lizthegrey) updated this for OBS 28.0 / OBS Websocket 5.0.
- aside from tweaks and bug fixes, this is mostly done
- if you know C or C++, then you should make an OBS Plugin that does the same thing this does, without the need to install NodeJS

## open captions vs closed captions
- "open captions" are always on, and burned directly into the video feed ... they cannot be turned off
- "closed captions" are optional and usually more accessible (user can customize caption appearance, better compatibility with screen reader software, etc.)
- this tool is for offering closed captions

## acknowledgments
- uses [obs-websocket-js](https://github.com/haganbmj/obs-websocket-js)
- talks to [obs-websocket](https://github.com/Palakis/obs-websocket)
