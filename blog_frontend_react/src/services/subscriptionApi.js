import { apiGet, apiPostJson } from "./api";

export const checkSubscription = async (targetId) => {
  try {
    const response = await apiGet(`/subscriptions/${targetId}`);
    return response;
  } catch (error) {
    console.error("구독 상태 확인 실패 :", error);
    return false;
  }
};

export const toggleSubscription = async (targetId) => {
  try {
    const response = await apiPostJson(`/subscriptions/${targetId}`, {});
    return response;
  } catch (error) {
    console.error("구독 토글 실패", error);
    throw error;
  }
};
