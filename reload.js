
        const CONFIG = {
            API_KEY: 'sk-aaovcfdkxjqrxnwayicxttjyfoavvberrgyldhhsnqrlndyt',
            API_URL: 'https://api.siliconflow.cn/v1/chat/completions', 
            MODEL: 'Qwen/Qwen2.5-Coder-7B-Instruct',  
            MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
            ALLOWED_TYPES: ['text/plain', 'application/pdf']
        }
        
        // 全局变量
        let subtitles = [];
        let repeatInterval = null;
        let videoElement = null;
        let currentSubtitle = null;
        let subtitleVisible = true; // 字幕是否可见
        const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0]; // 支持的播放速度
        let currentSpeedIndex = 2; // 默认1.0x
        
        // DOM 元素
        const fileInput = document.getElementById('file-input');
        const videoUpload = document.getElementById('video-upload');
        const videoContainer = document.getElementById('video-container');
        const videoPlayer = document.getElementById('video-player');
        const subtitleFileInput = document.getElementById('subtitle-file-input');
        const subtitleUpload = document.getElementById('subtitle-upload');
        const subtitlePlaceholder = document.getElementById('subtitle-placeholder');
        const subtitlesList = document.getElementById('subtitles-list');
        const stopRepeatBtn = document.getElementById('stop-repeat');
        const playPauseBtn = document.getElementById('play-pause-btn');
        const decreaseSpeedBtn = document.getElementById('decrease-speed');
        const increaseSpeedBtn = document.getElementById('increase-speed');
        const speedDisplay = document.getElementById('speed-display');
        const currentSubtitleDisplay = document.getElementById('current-subtitle-display');
        const currentSubtitleContainer = document.getElementById('current-subtitle-container');
        const toggleSubtitleBtn = document.getElementById('toggle-subtitle');
        const translationResult = document.getElementById('translation-result');
        const translatedWord = document.getElementById('translated-word');
        const translationContent = document.getElementById('translation-content');
        const subtitle听写 = document.getElementById('subtitle听写');
        const check听写 = document.getElementById('check听写');
        const 听写结果 = document.getElementById('听写结果');
        const correctionDisplay = document.getElementById('correction-display');
        const scoreDisplay = document.getElementById('score-display');
        
        // 初始化
        function init() {
            videoElement = videoPlayer;
            
            // 事件监听
            videoUpload.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', handleFileUpload);
            videoUpload.addEventListener('dragover', handleDragOver);
            videoUpload.addEventListener('drop', handleDrop);
            
            subtitleUpload.addEventListener('click', () => subtitleFileInput.click());
            subtitleFileInput.addEventListener('change', handleSubtitleFileUpload);
            subtitleUpload.addEventListener('dragover', handleDragOver);
            subtitleUpload.addEventListener('drop', handleSubtitleDrop);
            
            stopRepeatBtn.addEventListener('click', stopRepeatPlayback);
            playPauseBtn.addEventListener('click', togglePlayPause);
            decreaseSpeedBtn.addEventListener('click', decreasePlaybackSpeed);
            increaseSpeedBtn.addEventListener('click', increasePlaybackSpeed);
            check听写.addEventListener('click', checkSubtitle听写);
            toggleSubtitleBtn.addEventListener('click', toggleSubtitleVisibility);
            
            videoPlayer.addEventListener('timeupdate', handleVideoTimeUpdate);
            videoPlayer.addEventListener('play', updatePlayPauseButton);
            videoPlayer.addEventListener('pause', updatePlayPauseButton);
        }
        
        // 切换字幕可见性
        function toggleSubtitleVisibility() {
            subtitleVisible = !subtitleVisible;
            
            if (subtitleVisible) {
                currentSubtitleContainer.classList.remove('hidden');
                toggleSubtitleBtn.innerHTML = '<i class="fa fa-eye-slash mr-2"></i>隐藏字幕';
            } else {
                currentSubtitleContainer.classList.add('hidden');
                toggleSubtitleBtn.innerHTML = '<i class="fa fa-eye mr-2"></i>显示字幕';
            }
        }
        
        // 处理文件上传通用函数
        function handleDragOver(e) {
            e.preventDefault();
            e.currentTarget.classList.add('border-primary');
        }
        
        function handleDragLeave(e) {
            e.currentTarget.classList.remove('border-primary');
        }
        
        // 视频文件处理
        function handleFileUpload(e) {
            const file = e.target.files[0];
            if (file) {
                displayVideo(file);
            }
        }
        
        function handleDrop(e) {
            e.preventDefault();
            e.currentTarget.classList.remove('border-primary');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('video/')) {
                displayVideo(file);
            }
        }
        
        // 显示视频
        function displayVideo(file) {
            const videoURL = URL.createObjectURL(file);
            videoPlayer.src = videoURL;
            videoUpload.classList.add('hidden');
            videoContainer.classList.remove('hidden');
            resetPlaybackSpeed();
        }
        
        // 字幕文件处理
        function handleSubtitleFileUpload(e) {
            const file = e.target.files[0];
            if (file && file.name.endsWith('.srt')) {
                parseSRTFile(file);
            }
        }
        
        function handleSubtitleDrop(e) {
            e.preventDefault();
            e.currentTarget.classList.remove('border-primary');
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.srt')) {
                parseSRTFile(file);
            }
        }
        
        // 解析SRT字幕文件
        function parseSRTFile(file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const content = e.target.result;
                subtitles = parseSRTContent(content);
                
                if (subtitles.length > 0) {
                    renderSubtitles();
                    subtitlePlaceholder.classList.add('hidden');
                    subtitlesList.classList.remove('hidden');
                }
            };
            
            reader.readAsText(file, 'utf-8');
        }
        
        // 解析SRT内容
        function parseSRTContent(content) {
            const blocks = content.split(/\r?\n\r?\n/).filter(block => block.trim() !== '');
            const parsedSubtitles = [];
            
            blocks.forEach(block => {
                const lines = block.split(/\r?\n/).filter(line => line.trim() !== '');
                
                if (lines.length >= 2) {
                    const timeLine = lines[1];
                    const timeMatch = timeLine.match(/(\d+:\d+:\d+,\d+) --> (\d+:\d+:\d+,\d+)/);
                    
                    if (timeMatch) {
                        const startTime = srtTimeToSeconds(timeMatch[1]);
                        const endTime = srtTimeToSeconds(timeMatch[2]);
                        const text = lines.slice(2).join('\n').trim();
                        
                        if (startTime !== null && endTime !== null && text) {
                            parsedSubtitles.push({
                                id: Date.now() + parsedSubtitles.length,
                                startTime,
                                endTime,
                                text
                            });
                        }
                    }
                }
            });
            
            return parsedSubtitles.sort((a, b) => a.startTime - b.startTime);
        }
        
        // 将SRT时间格式转换为秒
        function srtTimeToSeconds(timeStr) {
            const match = timeStr.match(/^(\d+):(\d+):(\d+),(\d+)$/);
            if (!match) return null;
            
            const hours = parseInt(match[1], 10);
            const minutes = parseInt(match[2], 10);
            const seconds = parseInt(match[3], 10);
            const milliseconds = parseInt(match[4], 10);
            
            return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
        }
        
        // 渲染字幕列表
        function renderSubtitles() {
            subtitlesList.innerHTML = '';
            
            subtitles.forEach(subtitle => {
                const subtitleItem = document.createElement('div');
                subtitleItem.className = 'subtitle-item';
                subtitleItem.dataset.id = subtitle.id;
                
                subtitleItem.innerHTML = `
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-medium">${formatTime(subtitle.startTime)} - ${formatTime(subtitle.endTime)}</p>
                            <p class="text-gray-700 mt-1">${subtitle.text}</p>
                        </div>
                    </div>
                `;
                
                subtitleItem.addEventListener('click', () => {
                    playSubtitle(subtitle);
                });
                
                subtitlesList.appendChild(subtitleItem);
            });
        }
        
        // 显示当前字幕并将单词转为可点击状态
        function displayCurrentSubtitle(subtitle) {
            if (!subtitle) {
                currentSubtitleDisplay.innerHTML = '';
                currentSubtitle = null;
                return;
            }
            
            currentSubtitle = subtitle;
            const words = subtitle.text.split(/(\s+|[\.,!?;:"'\(\)])/);
            
            let html = '';
            words.forEach(word => {
                if (/[a-zA-Z]/.test(word)) {
                    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
                    const punctuation = word.replace(/[a-zA-Z]/g, '');
                    
                    if (cleanWord) {
                        html += `<span class="current-subtitle-word" data-word="${cleanWord}">${cleanWord}</span>${punctuation}`;
                    } else {
                        html += word;
                    }
                } else {
                    html += word;
                }
            });
            
            currentSubtitleDisplay.innerHTML = html;
            
            document.querySelectorAll('.current-subtitle-word').forEach(el => {
                el.addEventListener('click', (e) => {
                    const word = e.currentTarget.dataset.word;
                    translateWord(word);
                });
            });
        }
        
        // 翻译单词（使用硅基流动API）
        async function translateWord(word) {
            translatedWord.textContent = word;
            translationContent.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 正在翻译...';
            translationResult.classList.remove('hidden');

            try {
                const messages = [{
                    "role": "user",
                    "content": `请将单词"${word}"翻译成中文，并附上常用场景和句型搭配。只返回翻译结果，不要额外说明。`,
                }];

                const response = await fetch(CONFIG.API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${CONFIG.API_KEY}`,
                        'X-SiliconFlow-Client': 'web-app/1.0'
                    },
                    body: JSON.stringify({
                        model: CONFIG.MODEL,
                        messages: messages,
                        temperature: 0.3,
                        stream: false
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || `翻译失败: ${response.status}`);
                }

                const result = await response.json();
                const translation = result.choices[0].message.content.trim();
                translationContent.textContent = translation;

            } catch (error) {
                console.error('翻译出错:', error);
                translationContent.textContent = `翻译失败: ${error.message}`;
            }
        }
        
        // 检查字幕听写
        function checkSubtitle听写() {
            if (!currentSubtitle) {
                alert('没有可检查的字幕，请播放视频');
                return;
            }
            
            const userInput = subtitle听写.value.trim();
            if (!userInput) {
                alert('请输入听写内容');
                return;
            }
            
            // 处理原字幕和用户输入，提取单词（忽略标点）
            const originalWords = extractWords(currentSubtitle.text);
            const userWords = extractWords(userInput);
            
            // 比较单词并生成校正结果
            const { correctionHtml, score } = compareWords(originalWords, userWords);
            
            // 显示结果
            correctionDisplay.innerHTML = correctionHtml;
            scoreDisplay.textContent = `正确率: ${score}% (${getCorrectCount(originalWords, userWords)}/${originalWords.length})`;
            听写结果.classList.remove('hidden');
        }
        
        // 提取单词（忽略标点和大小写）
        function extractWords(text) {
            // 移除所有标点，分割为单词，转为小写
            return text
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(word => word.trim() !== '')
                .map(word => word.toLowerCase());
        }
        
        // 比较单词并生成校正HTML
        function compareWords(original, userInput) {
            let correctionHtml = '';
            let correctCount = 0;
            const maxLength = Math.max(original.length, userInput.length);
            
            for (let i = 0; i < maxLength; i++) {
                const originalWord = original[i];
                const userWord = userInput[i];
                
                if (!originalWord) {
                    // 用户输入了额外的单词
                    correctionHtml += `<span class="correction-word incorrect">${userWord}</span> `;
                } else if (!userWord) {
                    // 用户遗漏了单词
                    correctionHtml += `<span class="correction-word missing">${originalWord}</span> `;
                } else if (originalWord === userWord) {
                    // 单词正确
                    correctionHtml += `<span class="correction-word correct">${originalWord}</span> `;
                    correctCount++;
                } else {
                    // 单词错误 - 标红显示
                    correctionHtml += `<span class="correction-word incorrect">${userWord}→${originalWord}</span> `;
                }
            }
            
            const score = original.length > 0 ? Math.round((correctCount / original.length) * 100) : 0;
            return { correctionHtml, score };
        }
        
        // 获取正确的单词数量
        function getCorrectCount(original, userInput) {
            let count = 0;
            const minLength = Math.min(original.length, userInput.length);
            
            for (let i = 0; i < minLength; i++) {
                if (original[i] === userInput[i]) {
                    count++;
                }
            }
            
            return count;
        }
        
        // 播放指定字幕对应的视频片段
        function playSubtitle(subtitle) {
            stopRepeatPlayback();
            videoPlayer.currentTime = subtitle.startTime;
            videoPlayer.play();
            displayCurrentSubtitle(subtitle);
            highlightAndScrollToSubtitle(subtitle.id);
            
            repeatInterval = setInterval(() => {
                if (videoPlayer.currentTime >= subtitle.endTime) {
                    videoPlayer.currentTime = subtitle.startTime;
                    videoPlayer.play();
                }
            }, 100);
            
            stopRepeatBtn.classList.remove('hidden');
        }
        
        // 停止重复播放
        function stopRepeatPlayback() {
            if (repeatInterval) {
                clearInterval(repeatInterval);
                repeatInterval = null;
            }
            stopRepeatBtn.classList.add('hidden');
            
            document.querySelectorAll('.subtitle-item').forEach(item => {
                item.classList.remove('active');
            });
        }
        
        // 切换播放/暂停状态
        function togglePlayPause() {
            if (videoPlayer.paused || videoPlayer.ended) {
                videoPlayer.play();
            } else {
                videoPlayer.pause();
            }
        }
        
        // 更新播放/暂停按钮显示
        function updatePlayPauseButton() {
            if (videoPlayer.paused || videoPlayer.ended) {
                playPauseBtn.innerHTML = '<i class="fa fa-play mr-2"></i>播放';
                playPauseBtn.classList.remove('bg-primary');
                playPauseBtn.classList.add('bg-secondary');
            } else {
                playPauseBtn.innerHTML = '<i class="fa fa-pause mr-2"></i>暂停';
                playPauseBtn.classList.remove('bg-secondary');
                playPauseBtn.classList.add('bg-primary');
            }
        }
        
        // 播放速度控制
        function decreasePlaybackSpeed() {
            if (currentSpeedIndex > 0) {
                currentSpeedIndex--;
                setPlaybackSpeed(playbackSpeeds[currentSpeedIndex]);
            }
        }
        
        function increasePlaybackSpeed() {
            if (currentSpeedIndex < playbackSpeeds.length - 1) {
                currentSpeedIndex++;
                setPlaybackSpeed(playbackSpeeds[currentSpeedIndex]);
            }
        }
        
        function setPlaybackSpeed(speed) {
            videoPlayer.playbackRate = speed;
            speedDisplay.textContent = `${speed}x`;
            
            if (repeatInterval) {
                clearInterval(repeatInterval);
                const currentTime = videoPlayer.currentTime;
                const currentSubtitle = subtitles.find(sub => 
                    currentTime >= sub.startTime && currentTime <= sub.endTime
                );
                
                if (currentSubtitle) {
                    const interval = Math.max(50, 100 / speed);
                    repeatInterval = setInterval(() => {
                        if (videoPlayer.currentTime >= currentSubtitle.endTime) {
                            videoPlayer.currentTime = currentSubtitle.startTime;
                            videoPlayer.play();
                        }
                    }, interval);
                }
            }
        }
        
        function resetPlaybackSpeed() {
            currentSpeedIndex = 2;
            setPlaybackSpeed(playbackSpeeds[currentSpeedIndex]);
        }
        
        // 高亮并滚动到当前字幕
        function highlightAndScrollToSubtitle(subtitleId) {
            const subtitleElements = document.querySelectorAll('.subtitle-item');
            let targetElement = null;
            
            subtitleElements.forEach(item => {
                if (parseInt(item.dataset.id) === subtitleId) {
                    item.classList.add('active');
                    targetElement = item;
                } else {
                    item.classList.remove('active');
                }
            });
            
            if (targetElement) {
                scrollToSubtitle(targetElement);
            }
        }
        
        function scrollToSubtitle(element) {
            const container = subtitlesList;
            const containerRect = container.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            
            const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
            const targetScrollTop = relativeTop - (containerRect.height / 2) + (elementRect.height / 2);
            
            container.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });
        }
        
        // 处理视频时间更新
        function handleVideoTimeUpdate() {
            const currentTime = videoPlayer.currentTime;
            const activeSubtitle = subtitles.find(sub => 
                currentTime >= sub.startTime && currentTime <= sub.endTime
            );
            
            displayCurrentSubtitle(activeSubtitle);
            
            if (!repeatInterval) {
                if (activeSubtitle) {
                    highlightAndScrollToSubtitle(activeSubtitle.id);
                } else {
                    document.querySelectorAll('.subtitle-item').forEach(item => {
                        item.classList.remove('active');
                    });
                }
            }
        }
        
        // 格式化时间
        function formatTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        
        // 添加拖拽离开事件监听
        videoUpload.addEventListener('dragleave', handleDragLeave);
        subtitleUpload.addEventListener('dragleave', handleDragLeave);
        
        // 初始化应用
        document.addEventListener('DOMContentLoaded', init);
