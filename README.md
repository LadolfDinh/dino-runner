# Dino Runner - Khung long nhay

Mo game: bam dup shortcut **Dino Runner** tren Desktop.
Game mo trong cua so rieng; dong cua so la server tu tat.

## Cau truc
- `src/`          ma nguon game (index.html, style.css, game.js, icon.png)
- `dist/`         ban build (tu tao)
- `assets/`       icon.ico cho shortcut
- `build.js`      build: copy src -> dist
- `server.js`     server local (http://127.0.0.1:5173)
- `launcher.js`   build neu can -> bat server an -> mo cua so app (Edge/Chrome --app) -> dong cua so thi tat server
- `DinoRunner.vbs` chay launcher an (shortcut tro vao file nay)
- `start.bat`     cach chay cu, co cua so lenh (de debug)

## Dieu khien
Space / Up: nhay - Down: cui - P / Esc: tam dung - M: tat am thanh

## Lenh cho dev
- `npm run build`  build
- `npm start`      chay server
- `npm run dev`    build + chay server

Log cua launcher: %LOCALAPPDATA%\DinoRunner\launcher.log
