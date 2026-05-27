import { useState, useEffect, useRef } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import { useNavigate, Link } from "react-router-dom";
import { apiGet, apiPatch, apiDelete } from "../../services/api";
import "./NotificationBell.css";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // 초기 알림 목록 + 안읽은 수 불러오기
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await apiGet("/notifications/unread");
      setNotifications(data || []);
    } catch {}
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await apiGet("/notifications/unread-count");
      setUnreadCount(data?.count || 0);
    } catch {}
  };

  useEffect(() => {
    const eventSource = new EventSourcePolyfill(
      "http://localhost:8000/api/v1/notifications/subscribe",
      {
        withCredentials: true,
        heartbeatTimeout: 3600000,
      },
    );
    eventSource.onopen = () => {
      console.log("알림 서버에 연결되었습니다.");
    };

    eventSource.addEventListener("notification", (e) => {
      try {
        const parsed = JSON.parse(e.data);
        //   const message = e.data;
        // console.log("🔔새 알림 도착!", message);

        setNotifications((prev) => [
          {
            notificationId: Date.now(),
            content: parsed.content,
            url: parsed.url,
            read: false,
            createdAt: new Date().toISOString(),
            isTemp: true,
          },
          ...prev,
        ]);
        setUnreadCount((prev) => prev + 1);
      } catch {
        console.error("알림 파싱 실패 ", e.data);
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutSide = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutSide);
    return () => document.removeEventListener("mousedown", handleClickOutSide);
  }, []);

  const handleBellClick = () => {
    // setIsOpen(!isOpen);
    // if (!isOpen) {
    //   setUnreadCount(0);
    // }
    setIsOpen((prev) => !prev);
  };

  // 알림 클릭 -> 읽음 처리 -> URL 이동
  const handleNotiClick = async (noti) => {
    if (!noti.read && !noti.isTemp) {
      try {
        await apiPatch(`/notifications/${noti.notificationId}/read`);
        setNotifications((prev) =>
          prev.filter((n) => n.notificationId !== noti.notificationId),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {
        console.error("읽음 처리 실패", e);
      }
    }
    setIsOpen(false);
    if (noti.url && !noti.url.startsWith("/users")) {
      navigate(noti.url);
    }
  };

  //단건 삭제
  const handleDelete = async (e, noti) => {
    e.stopPropagation();
    try {
      if (!noti.isTemp) {
        await apiDelete(`/notifications/${noti.notificationId}`);
      }
      setNotifications((prev) =>
        prev.filter((n) => n.notificationId !== noti.notificationId),
      );
      if (!noti.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("알림 삭제 실패", e);
    }
  };
  //전체 읽음
  const handleReadAll = async () => {
    try {
      await apiPatch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("전체 읽음 처리 실패", e);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="notification-wrapper" ref={wrapperRef}>
      <button className="bell-btn" onClick={handleBellClick}>
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <span>알림</span>
            {notifications.some((n) => !n.read) && (
              <button className="read-all-btn" onClick={handleReadAll}>
                전체 읽음
              </button>
            )}
          </div>
          <ul className="notification-list">
            {notifications.length === 0 ? (
              <li className="no-noti">새로운 알림이 없습니다.</li>
            ) : (
              notifications.map((noti) => (
                <li
                  key={noti.notificationId}
                  className={`noti-item ${noti.read ? "read" : "unread"}`}
                  onClick={() => handleNotiClick(noti)}
                >
                  <div className="noti-content">
                    {!noti.read && <span className="unread-dot" />}
                    <div className="noti-text">
                      <p>{noti.content}</p>
                      <span className="noti-date">
                        {formatDate(noti.createdAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    className="noti-delete-btn"
                    onClick={(e) => handleDelete(e, noti)}
                    title="알림 삭제"
                  >
                    ✕
                  </button>
                </li>
              ))
            )}
          </ul>
          <div className="dropdown-footer">
            <Link to="/notifications" onClick={() => setIsOpen(false)}>
              전체보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
