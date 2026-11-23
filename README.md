# Dino Runner - Khung long nhay

Choi online: [Dino Runner](https://ladolfdinh.github.io/dino-runner/)

## Chay tren may
Can cai Node.js.

```sh
git clone https://github.com/LadolfDinh/dino-runner.git
cd dino-runner
npm run dev
```

Mo [http://127.0.0.1:5173](http://127.0.0.1:5173) trong trinh duyet.

Shortcut **Dino Runner** tren Desktop la tuy chon. Tren Windows, chay `tools/make-shortcut.ps1` bang PowerShell de tao shortcut.
Bam dup shortcut de mo game trong cua so rieng. Dong cua so thi server tu tat.

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
