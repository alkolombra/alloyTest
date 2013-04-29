ffmpeg.exe -i input.mp4 -vf movie=box_template_2_RENDER.png[watermark];[in][watermark]overlay=0:0[out] outputvideo.mp4
pause