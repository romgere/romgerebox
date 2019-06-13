#!/bin/bash
for i in *.wav; do
  j="${i%.wav}"
  soundconverter -b -m audio/mpeg -s .mp3 "$j.wav" && rm -f "$j.wav"  && echo "$i réencodé en mp3."
done
