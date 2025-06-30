
        header = document.querySelector('#header');
        pgbar = document.querySelector('.loader');
        const fs = require('node:fs');
        const path = require('path');
        var Mousetrap = require('mousetrap');
        
        
            css = fs.readFileSync(path.join(__dirname, 'src/riro.css').replace('app.asar', 'app.asar.unpacked'), 'utf8');
        
        // try {
        //     darkcss = fs.readFileSync('./src/darkmode.css', 'utf8');
        // } catch (error) {
        //     darkcss = fs.readFileSync('./resources/app.asar.unpacked/src/darkmode.css', 'utf8');
        //     console.error(error)
        // }
        isdark = 0;
        isSplitMode = false;
        
        function toggleSplit() {
            // 로그인 페이지에서는 분할 기능 비활성화
            if (window.loginpage && window.loginpage.style.display === 'block') {
                return;
            }
            
            const container = document.querySelector('.webview-container');
            const leftWebview = document.querySelector('#riro');
            const rightWebview = document.querySelector('#riro2');
            const splitBtn = document.querySelector('.split-btn');
            const resizer = document.querySelector('.resizer');
            
            if (!isSplitMode) {
                // 분할 모드 활성화
                container.classList.add('split-mode');
                leftWebview.classList.add('active');
                rightWebview.classList.add('active');
                splitBtn.classList.add('active');
                isSplitMode = true;
                
                // 초기 크기 설정 (50:50)
                leftWebview.style.width = '50%';
                rightWebview.style.width = '50%';
                
                // 오른쪽 webview에 동일한 URL 로드
                rightWebview.src = leftWebview.src;
                
                // 오른쪽 webview도 CSS 적용
                setTimeout(() => {
                    rightWebview.insertCSS(css);
                }, 1000);
            } else {
                // 분할 모드 비활성화
                container.classList.remove('split-mode');
                rightWebview.classList.remove('active');
                splitBtn.classList.remove('active');
                isSplitMode = false;
                
                // 크기 초기화
                leftWebview.style.width = '';
                rightWebview.style.width = '';
            }
        }
        
        // Resizer 드래그 기능
        function initResizer() {
            const resizer = document.querySelector('.resizer');
            const leftWebview = document.querySelector('#riro');
            const rightWebview = document.querySelector('#riro2');
            const container = document.querySelector('.webview-container');
            
            let isResizing = false;
            
            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                document.body.classList.add('resizing');
                
                // 드래그 중 webview 이벤트 차단
                leftWebview.style.pointerEvents = 'none';
                rightWebview.style.pointerEvents = 'none';
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                
                const containerRect = container.getBoundingClientRect();
                const offsetX = e.clientX - containerRect.left;
                const containerWidth = containerRect.width;
                
                // 최소/최대 크기 제한 (20% ~ 80%)
                const minWidth = containerWidth * 0.2;
                const maxWidth = containerWidth * 0.8;
                
                if (offsetX >= minWidth && offsetX <= maxWidth) {
                    const leftPercent = (offsetX / containerWidth) * 100;
                    const rightPercent = 100 - leftPercent;
                    
                    leftWebview.style.width = leftPercent + '%';
                    rightWebview.style.width = rightPercent + '%';
                }
            });
            
            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.classList.remove('resizing');
                    
                    // webview 이벤트 복원
                    leftWebview.style.pointerEvents = '';
                    rightWebview.style.pointerEvents = '';
                }
            });
        }
        
        // 새 창 함수 (로그인 페이지에서 비활성화)
        window.newWindow = function() {
            // 로그인 페이지에서는 새 창 기능 비활성화
            if (window.loginpage && window.loginpage.style.display === 'block') {
                return;
            }
            
            // IPC를 통해 새 창 생성
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('create-new-window');
        }
        
        // 로그인 페이지 상태 관리 함수
        function setLoginPageState(isLoginPage) {
            const webviewContainer = document.querySelector('.webview-container');
            const newwindowBtn = document.querySelector('.newwindow-btn');
            const splitBtn = document.querySelector('.split-btn');
            
            if (isLoginPage) {
                // 로그인 페이지: webview-container 숨기기, 버튼들 비활성화
                if (webviewContainer) webviewContainer.style.display = 'none';
                if (newwindowBtn) {
                    newwindowBtn.style.pointerEvents = 'none';
                    newwindowBtn.style.opacity = '0.3';
                }
                if (splitBtn) {
                    splitBtn.style.pointerEvents = 'none';
                    splitBtn.style.opacity = '0.3';
                }
            } else {
                // 메인 페이지: webview-container 표시, 버튼들 활성화
                if (webviewContainer) webviewContainer.style.display = 'flex';
                if (newwindowBtn) {
                    newwindowBtn.style.pointerEvents = 'auto';
                    newwindowBtn.style.opacity = '1';
                }
                if (splitBtn) {
                    splitBtn.style.pointerEvents = 'auto';
                    splitBtn.style.opacity = '1';
                }
            }
        }
        
        function loadwebview() {
            // DOM 요소들 초기화
            if (!window.idinput) window.idinput = document.querySelector('#idinput');
            if (!window.pwinput) window.pwinput = document.querySelector('#pwinput');
            if (!window.autologin) window.autologin = document.querySelector('#autologin');
            if (!window.loginpage) window.loginpage = document.querySelector('.loginpage');
            
            webview = document.querySelectorAll('#riro, #riro2');
            webview.forEach((element, i) => {
                element.addEventListener("load-commit", (e) => {
                    element.insertCSS(css);
                    if (isdark) {
                        element.insertCSS(darkcss);
                    }
                    if (e.url.startsWith('https://dankook.riroschool.kr/') == false && e.url != 'about:blank') {
                        element.goBack()
                        window.openExternal(e.url);
                        console.log(e.url);
                    }
                    if (element.isDevToolsOpened() == false) {
                        // webview.openDevTools();
                    }
                    if (e.url == "https://dankook.riroschool.kr/") {       
                        window.loginpage.style.display = 'none';
                        element.style.display = '';
                        setLoginPageState(false); // 메인 페이지로 이동
                        if (window.autologin.checked) {
                            window.save('id', window.idinput.value);
                            window.save('pw', window.pwinput.value);
                        }
                        element.setAttribute('src', 'https://dankook.riroschool.kr/home.php')
                        // document.querySelector('.tab').style.display=''
                    }
                    else if (e.url == "https://dankook.riroschool.kr/user.php?action=signin") {
                        window.loginpage.style.display = 'block';
                        element.style.display = 'none';
                        setLoginPageState(true); // 로그인 페이지로 이동
                        window.loadidpw();
                    }
                    try {
                        element.executeJavaScript(`parent.console.log(document.querySelectorAll('h2')[1].innerText)`);
                    } catch {
                        
                    }
                })

                element.addEventListener("dom-ready", (e) => {
                    header.style.display = 'block';
        //             element.executeJavaScript(`document.querySelectorAll("a[target='_blank']").forEach((e) => {
        //                 e.setAttribute("target", "")
        //             })
        //             document.onkeydown = (e) => {
        //     if (e.key == "r" && e.ctrlKey) {
        //         e.preventDefault();
        //         location.reload();
        //     }
        // }    
        //             `)
                });

                // 로그아웃 감지
                element.addEventListener("will-navigate", (e) => {
                    if (e.url == "https://dankook.riroschool.kr/user.php?action=user_logout") {
                        if (window.idinput) window.idinput.value = '';
                        if (window.pwinput) window.pwinput.value = '';
                        if (window.autologin) window.autologin.checked = false;
                        setLoginPageState(true); // 로그아웃 시 로그인 페이지 상태로 변경
                        if (window.resetidpw) window.resetidpw();
                    }
                });
            });
        }

        // element.addEventListener('page-title-updated', (e) => {
        //     document.querySelectorAll(".newtabbtn")[i].innerText = 'DKSH';
        // })



        window.idinput = document.querySelector('#idinput');
        window.pwinput = document.querySelector('#pwinput');
        window.loginbtn = document.querySelector('#loginbtn');
        window.autologin = document.querySelector('#autologin');
        window.loginpage = document.querySelector('.loginpage');

        window.idinput.addEventListener("keydown", (e) => {
            if (e.keyCode == 13) {
                window.pwinput.focus();
            }
        })
        
        window.pwinput.addEventListener("keydown", (e) => {
            if (e.keyCode == 13) {
                login(window.idinput.value, window.pwinput.value);
            }
        })

        darkmode = document.querySelector('#darkmode')

        function login(id, pw) {
            webview.forEach(element => {
                element.executeJavaScript(`document.querySelector(".input_normal[type='text']").value = "${id}";
            document.querySelector(".input_normal[type='password']").value = "${pw}";
            document.querySelector(".renewal_signin_container .button_normal").click();
            `)
            // if (darkmode.checked) {
            //     save('darkmode', '1');
            // }
            // else {
            //     save('darkmode', '0');
            // }
            });
        }

        // if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && isdark == 0) {
        //     darkmode.checked = false;
        // }

        webviewnum=1;
        currenttab = 0;


        

        loadwebview()

        // 초기 로그인 페이지 상태 설정
        setLoginPageState(true);

        // Resizer 초기화
        initResizer();

        // 초기 전체 화면 상태 확인
        checkInitialFullscreenStatus();

        // 플랫폼 감지
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

        // 새로고침 단축키 (Ctrl+R / Cmd+R)
        Mousetrap.bind([isMac ? 'cmd+r' : 'ctrl+r'], (e) => {
            e.preventDefault();
            if (webview && webview[currenttab]) {
                webview[currenttab].reload();
            }
        });

        // 새 창 단축키 (Ctrl+N / Cmd+N)
        Mousetrap.bind([isMac ? 'cmd+n' : 'ctrl+n'], (e) => {
            e.preventDefault();
            if (typeof newWindow === 'function') {
                newWindow();
            }
        });

        // 창 닫기 단축키 (Ctrl+W / Cmd+W)
        Mousetrap.bind([isMac ? 'cmd+w' : 'ctrl+w'], (e) => {
            e.preventDefault();
            if (typeof closeWindow === 'function') {
                closeWindow();
            }
        });

        // 뒤로가기 단축키 (Alt+Left / Cmd+Left)
        Mousetrap.bind([isMac ? 'cmd+left' : 'alt+left'], (e) => {
            e.preventDefault();
            if (webview && webview[currenttab]) {
                webview[currenttab].goBack();
            }
        });

        // 앞으로가기 단축키 (Alt+Right / Cmd+Right)
        Mousetrap.bind([isMac ? 'cmd+right' : 'alt+right'], (e) => {
            e.preventDefault();
            if (webview && webview[currenttab]) {
                webview[currenttab].goForward();
            }
        });

        // 전체화면 토글 (F11 / Cmd+Ctrl+F)
        Mousetrap.bind([isMac ? 'cmd+ctrl+f' : 'f11'], (e) => {
            e.preventDefault();
            toggleFullscreen();
        });

        // 개발자 도구 (F12 / Cmd+Alt+I)
        Mousetrap.bind([isMac ? 'cmd+alt+i' : 'f12'], (e) => {
            e.preventDefault();
            openDevTools();
        });

        // 화면 분할 토글 (Cmd+D / Ctrl+D)
        Mousetrap.bind([isMac ? 'cmd+d' : 'ctrl+d'], (e) => {
            e.preventDefault();
            toggleSplit();
        });