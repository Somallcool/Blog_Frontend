import { useState, useEffect } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import "./NotificationBell.css";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const eventSource = new EventSourcePolyfill(
      "http://localhost:8000/api/v1/notifications/subscribe",
      {
        withCredentials: true,
        heartbeatTimeout: 3600000,
      },
    );
    eventSource.onopen = () => {
      console.log("알림 서버에 연결되었습니다.(쿠키 인증");
    };

    eventSource.addEventListener("notification", (e) => {
      const message = e.data;
      console.log("🔔새 알림 도착!", message);

      setNotifications((prev) => [
        { id: Date.now(), content: message },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
    });

    eventSource.onerror = (e) => {
      console.error("SSE 연결 오류(로그인 필요)", e);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <div className="notification-wrapper">
      <button className="bell-btn" onClick={handleBellClick}>
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">알림</div>
          <ul className="notification-list">
            {notifications.length === 0 ? (
              <li className="no-noti">새로운 알림이 없습니다.</li>
            ) : (
              notifications.map((noti) => (
                <li key={noti.id} className="noti-item">
                  {noti.content}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
