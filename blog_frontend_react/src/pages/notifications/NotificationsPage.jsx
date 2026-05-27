import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPatch, apiDelete } from "../../services/api";
import "./NotificationsPage.css";

/**
 * 알림 전체 확인 페이지 /notifications
 * PrivateRoute 보호
 *
 * API :
 *  GET : /notifications
 *  PATCH : /notifications/{id}/read -> 단건 읽음
 *  PATCH : /notifications/read-all -> 전체 읽음
 *  DELETE : /notifications/{id} -> 단건 삭제
 */

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/notifications");
      setNotifications(data || []);
    } catch (e) {
      console.error("알림 목록 조회 실패", e);
    } finally {
      setLoading(false);
    }
  };

  //알림 클릭 -> 읽음 처리 -> 이동
  const handleClick = async (noti) => {
    if (!noti.read) {
      try {
        await apiPatch(`/notifications/${noti.notificationId}/read`);
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === noti.notificationId ? { ...n, read: true } : n,
          ),
        );
      } catch (e) {
        console.error("읽음 처리 실패", e);
      }
    }
    if (noti.url && !noti.url.startsWith("/users")) {
      navigate(noti.url);
    }
  };

  //단건 삭제
  const handleDelete = async (e, noti) => {
    e.stopPropagation();
    try {
      await apiDelete(`/notifications/${noti.notificationId}`);
      setNotifications((prev) =>
        prev.filter((n) => n.notificationId !== noti.notificationId),
      );
    } catch (e) {
      console.error("알림 삭제 실패", e);
    }
  };

  // 전체 읽음
  const handleReadAll = async () => {
    try {
      await apiPatch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="np-page">
      <div className="np-container">
        <div className="np-header">
          <h1 className="np-title">알림</h1>
          {hasUnread && (
            <button className="np-read-all-btn" onClick={handleReadAll}>
              전체 읽음
            </button>
          )}
        </div>
        {loading ? (
          <div className="np-empty">불러오는 중...</div>
        ) : notifications.length === 0 ? (
          <div className="np-empty">
            {/* <span className="np-empty-icon">🔔</span> */}
            <p>새로운 알림이 없습니다.</p>
          </div>
        ) : (
          <ul className="np-list">
            {notifications.map((noti) => (
              <li
                key={noti.notificationId}
                className={`np-item ${noti.read ? "read" : "unread"}`}
                onClick={() => handleClick(noti)}
              >
                <div className="np-item-left">
                  {!noti.read && <span className="np-unread-dot" />}
                  <div className="np-item-text">
                    <p className="np-item-content">{noti.content}</p>
                    <span className="np-item-date">
                      {formatDate(noti.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  className="np-delete-btn"
                  onClick={(e) => handleDelete(e, noti)}
                  title="알림 삭제"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
