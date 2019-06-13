#!/bin/bash
for i in *.wav; do
  j="${i%.wav}"
  soundconverter -b -m audio/x-vorbis -s .ogg "$j.wav" && rm -f "$j.wav"  && echo "$i réencodé en ogg."
done
