#!/bin/bash
for i in *.ogg; do
  j="${i%.ogg}"
  soundconverter -b -m audio/mpeg -s .mp3 "$j.ogg" && rm -f "$j.ogg"  && echo "$i réencodé en mp3."
done
