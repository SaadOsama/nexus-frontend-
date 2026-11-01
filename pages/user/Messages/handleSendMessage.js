const handleSendMessage = async (e) => {
  e.preventDefault();

  if (!newMessage.trim() || !activeUser) return;

  // 1. Storage se Token fetch karein (Check if key is 'token' or 'authToken')
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');

  if (!token) {
    alert("Token nahi mila! Baraye meharbani dobara login karein.");
    return;
  }

  const messageText = newMessage.trim();
  const receiverId = Number(activeUser.id);

  // Input Box Clear
  setNewMessage('');

  // 2. Local UI State Update (Immediate display)
  const tempMsg = {
    id: Date.now(),
    sender_id: currentUser?.id,
    receiver_id: receiverId,
    message: messageText,
    created_at: new Date().toISOString()
  };
  setMessages((prev) => [...prev, tempMsg]);

  // 3. Socket Emit (For real-time delivery if connected)
  if (socket && socket.connected) {
    socket.emit('send_message', {
      senderId: currentUser?.id,
      receiverId: receiverId,
      message: messageText
    });
  }

  // 4. REST API Call to Save Message in MariaDB
  try {
    const response = await fetch('https://nexus-backend-fbcotg.fly.dev/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Middleware format match
      },
      body: JSON.stringify({
        receiverId: receiverId,
        message: messageText
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Server Error:', data);
      
      // Agar token expire ho chuka hai
      if (data.message === 'Invalid or expired token.') {
        alert("Aapka login session expire ho gaya hai. Plz Logout karke dobara Login karein.");
      } else {
        alert(`Error: ${data.message}`);
      }
    } else {
      console.log('✅ Success! Message saved in DB with ID:', data.id);
      
      // Conversations refresh karein taaki list hamesha DB se synced rahe
      if (typeof fetchConversations === 'function') {
        fetchConversations();
      }
    }
  } catch (err) {
    console.error('❌ Network Fetch Error:', err);
  }
};
