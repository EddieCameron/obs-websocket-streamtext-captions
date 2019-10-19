# obs-websocket-streamtext-captions
NodeJS tool to feed live [StreamText](https://streamtext.net/) caption data into [Open Broadcaster Software (OBS)](https://obsproject.com/), so it can format captions into EIA-608 spec for [Twitch closed captioning](https://help.twitch.tv/s/article/guide-to-closed-captions?language=en_US). If you don't use this, you basically have to roll your own media encoder tech stack (Wowza, etc) or buy an expensive hardware caption encoder.

## install
1. download and install [NodeJS](https://nodejs.org/en/download/) on your OBS computer
2. download or clone this repo, open it in command line / terminal / bash, and run `npm install`
3. in OBS, go to **Tools > Options > Captions (Experimental)** and enable captions on a muted sound source (don't worry, those bad captions will get overridden by this tool)
4. download and install [obs-websocket](https://github.com/Palakis/obs-websocket) plugin, and activate it via **Tools > Options > WebSockets Server Settings**

## usage
- during your broadcast, run `node index [address:port] [password] [streamtext_event]` in your terminal
    - example: `node index localhost:4444 myPassword IHaveADream`
- OR, edit the provided .bat file in a text editor, and then double-click on it (Windows)

## how it works / workflow / pipeline
1. hire a human stenographer / live captioner / CART provider to type out captions, really really fast, into StreamText
2. this tool takes the StreamText data, and sends it into an OBS WebSocket Server via its [SendCaptions protocol](https://github.com/Palakis/obs-websocket/blob/4.x-current/docs/generated/protocol.md#sendcaptions)
3. OBS uses [libcaption](https://github.com/szatmary/libcaption) (already bundled with OBS) to encode the text into EIA-608 format, to embed into the RMTP data stream (see [Twitch's requirements for closed caption data](https://help.twitch.tv/s/article/guide-to-closed-captions?language=en_US) )
4. Twitch's media servers ingest the video feed / caption data, and then it hopefully enables the closed caption feature for your viewers

If you cannot afford or don't want to hire a human live captioner, there are already tools like [Web Captioner](https://webcaptioner.com/) that can easily hook into OBS. This tool is specifically for Twitch broadcasts that want to provide closed captions via human live captioners.

## open captions vs closed captions
- "open captions" are always on, and burned directly into the video feed
- "closed captions" are optional and user customizable, and are generally considered to be more accessible (especially for screen reader software, etc.)
- this tool is for offering closed captions

## acknowledgments
- uses [obs-websocket-js](https://github.com/haganbmj/obs-websocket-js)
