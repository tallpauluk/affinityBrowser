let currentModuleIndex = 0;
let currentPageIndex = 0;
let contentData = null;

// Password protection - using SHA-256 hash
const PASSWORD_HASH = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8';

// SHA-256 hashing function
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Check if user is already authenticated
if (localStorage.getItem('authenticated') === 'true') {
    showContent();
} else {
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const hashedPassword = await sha256(password);
        
        if (hashedPassword === PASSWORD_HASH) {
            localStorage.setItem('authenticated', 'true');
            showContent();
        } else {
            alert('Incorrect password');
        }
    });
}

function showContent() {
    document.getElementById('login-overlay').style.display = 'none';
    document.querySelector('.container').style.display = 'block';
    loadContent();
}

function loadContent() {
    const selectedFile = document.getElementById('json-select').value;
    // Load the JSON data
    fetch(selectedFile)
        .then(response => response.json())
        .then(data => {
            contentData = data;
            currentModuleIndex = 0;
            currentPageIndex = 0;
            createModuleNavigation();
            updateContent();
        })
        .catch(error => {
            console.error('Error loading content:', error);
            alert('Error loading content file. Please try another file.');
        });
}

function createModuleNavigation() {
    const moduleNav = document.getElementById('module-navigation');
    moduleNav.innerHTML = '';
    
    contentData.modules.forEach((module, index) => {
        const button = document.createElement('button');
        button.className = 'module-btn';
        button.textContent = module.module_title;
        button.onclick = () => {
            currentModuleIndex = index;
            currentPageIndex = 0;
            updateContent();
        };
        moduleNav.appendChild(button);
    });
}

function updateContent() {
    const module = contentData.modules[currentModuleIndex];
    const page = module.playlist[currentPageIndex];
    
    // Update module navigation
    const moduleButtons = document.querySelectorAll('.module-btn');
    moduleButtons.forEach((btn, index) => {
        btn.classList.toggle('active', index === currentModuleIndex);
    });
    
    // Update page navigation
    document.getElementById('prev-btn').disabled = currentPageIndex === 0;
    document.getElementById('next-btn').disabled = currentPageIndex === module.playlist.length - 1;
    document.getElementById('page-indicator').textContent = `Page ${currentPageIndex + 1} of ${module.playlist.length}`;
    
    // Update content
    document.getElementById('module-title').textContent = module.module_title;
    const contentDisplay = document.getElementById('content-display');
    contentDisplay.innerHTML = '';
    
    if (page.type === 'video') {
        const videoLink = document.createElement('a');
        videoLink.href = page.video_url;
        videoLink.className = 'video-link';
        videoLink.textContent = 'Click to view video';
        videoLink.target = '_blank';
        contentDisplay.appendChild(videoLink);
    } else if (page.type === 'multi_choice' || page.type === 'likert') {
        page.question.forEach(q => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question';
            questionDiv.innerHTML = `<h3>${q.title || ''}</h3><p>${q.text}</p>`;
            
            const answersDiv = document.createElement('div');
            answersDiv.className = 'answers';
            
            q.answers.forEach(answer => {
                const answerDiv = document.createElement('div');
                answerDiv.className = 'answer';
                
                const input = document.createElement('input');
                input.type = page.type === 'multi_choice' ? 'checkbox' : 'radio';
                input.name = `question_${q.id}`;
                input.value = answer.id;
                
                const label = document.createElement('label');
                label.textContent = answer.text;
                
                answerDiv.appendChild(input);
                answerDiv.appendChild(label);
                answersDiv.appendChild(answerDiv);
            });
            
            questionDiv.appendChild(answersDiv);
            contentDisplay.appendChild(questionDiv);
        });
    } else if (page.type === 'info_i') {
        page.question.forEach(q => {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'info';
            infoDiv.innerHTML = `<h3>${q.title || ''}</h3><p>${q.text}</p>`;
            contentDisplay.appendChild(infoDiv);
        });
    } else {
        const unknownDiv = document.createElement('div');
        unknownDiv.className = 'unknown-type';
        unknownDiv.innerHTML = `<h3>Unknown Content Type: ${page.type}</h3><pre>${JSON.stringify(page, null, 2)}</pre>`;
        contentDisplay.appendChild(unknownDiv);
    }
}

// Add navigation event listeners
document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentPageIndex > 0) {
        currentPageIndex--;
        updateContent();
    }
});

document.getElementById('next-btn').addEventListener('click', () => {
    if (currentPageIndex < contentData.modules[currentModuleIndex].playlist.length - 1) {
        currentPageIndex++;
        updateContent();
    }
});

// Add file selection change handler
document.getElementById('json-select').addEventListener('change', () => {
    loadContent();
});