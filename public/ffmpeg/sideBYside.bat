ffmpeg -i input.mp4 -vf "[in]scale=iw/2:ih/2,pad=2*iw:ih[left];movie=input.mp4,scale=iw/2:ih/2[right];[left][right]overlay=main_w/2:0[out]" output.mp4
pause