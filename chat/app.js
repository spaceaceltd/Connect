
// Server-based chatroom app
class Chatroom {
    constructor() {
        this.localName = localStorage.getItem('chatroom_name') || 'You';
        this.room = localStorage.getItem('chatroom_room') || this.promptRoom();
        localStorage.setItem('chatroom_room', this.room);
        this.messages = [];
        this.init();
    }

    promptRoom() {
        let room = prompt('Enter chatroom number:', '1001');
        room = room ? room.trim() : '1001';
        return room.replace(/[^a-zA-Z0-9_-]/g, '');
    }

    changeRoom() {
        const newRoom = this.promptRoom();
        if (newRoom && newRoom !== this.room) {
            this.room = newRoom;
            localStorage.setItem('chatroom_room', this.room);
            this.messages = [];
            this.renderMessages();
            this.loadMessages();
        }
    }

    async init() {
        // Set name input
        const nameInput = document.getElementById('peerNameInput');
        if (nameInput) {
            nameInput.value = this.localName;
            nameInput.addEventListener('change', (e) => {
                this.localName = e.target.value.trim() || 'You';
                localStorage.setItem('chatroom_name', this.localName);
            });
            nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    nameInput.blur();
                }
            });
        }

        // Background image upload
        const bgUpload = document.getElementById('bgUpload');
        if (bgUpload) {
            bgUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        localStorage.setItem('chatroom_bg', ev.target.result);
                        document.body.style.backgroundImage = `url('${ev.target.result}')`;
                        document.body.style.backgroundSize = 'cover';
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        // Load background if set
        const bg = localStorage.getItem('chatroom_bg');
        if (bg) {
            document.body.style.backgroundImage = `url('${bg}')`;
            document.body.style.backgroundSize = 'cover';
        }

        // Enable input
        document.getElementById('messageInput').disabled = false;
        document.getElementById('sendBtn').disabled = false;

        // Event listeners
        document.getElementById('sendBtn').addEventListener('click', () => {
            this.sendMessage();
        });
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Add manual refresh button to status bar
        let refreshBtn = document.getElementById('refreshBtn');
        if (!refreshBtn) {
            refreshBtn = document.createElement('button');
            refreshBtn.id = 'refreshBtn';
            refreshBtn.className = 'btn-refresh';
            refreshBtn.textContent = 'Refresh';
            const statusBar = document.querySelector('.status-bar');
            statusBar.appendChild(refreshBtn);
        }
        refreshBtn.addEventListener('click', () => this.loadMessages());

        // Add change room button listener
        const changeRoomBtn = document.getElementById('changeRoomBtn');
        if (changeRoomBtn) {
            changeRoomBtn.addEventListener('click', () => this.changeRoom());
        }

        await this.loadMessages();
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        if (!text) return;
        const msg = {
            fromName: this.localName,
            text: text
        };
        try {
            await fetch(`chatroom.php?room=${encodeURIComponent(this.room)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(msg)
            });
            input.value = '';
            await this.loadMessages();
        } catch (err) {
            alert('Failed to send message');
        }
    }

    async loadMessages() {
        try {
            const resp = await fetch(`chatroom.php?room=${encodeURIComponent(this.room)}`);
            if (!resp.ok) return;
            const data = await resp.json();
            this.messages = Array.isArray(data.messages) ? data.messages : [];
            this.renderMessages();
        } catch (err) {
            // ignore
        }
    }

    renderMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';
        this.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message' + (msg.fromName === this.localName ? ' own' : ' other');
            const senderLabel = document.createElement('div');
            senderLabel.className = 'message-sender';
            senderLabel.textContent = msg.fromName || 'User';
            const bubble = document.createElement('div');
            bubble.className = 'message-bubble';
            bubble.textContent = msg.text;
            const meta = document.createElement('div');
            meta.className = 'message-meta';
            const date = new Date(msg.timestamp * 1000);
            const isoString = date.toISOString().split('.')[0];
            meta.textContent = isoString;
            messageDiv.appendChild(senderLabel);
            messageDiv.appendChild(bubble);
            messageDiv.appendChild(meta);
            messagesContainer.appendChild(messageDiv);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatroom = new Chatroom();
});
