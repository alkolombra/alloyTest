ffmpeg -i input.mp4 -vf "movie=input.mp4, scale=iw/5:ih/5 [small]; [in][small] overlay=main_w*0.77:main_h*0.77 [out]" output.mp4
pause