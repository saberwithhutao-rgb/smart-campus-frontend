import request from '@/utils/request';

// 查询所有场馆
export const getVenues = async () => {
  try {
    const response = await request.get('/api/sports/venues');
    return response.data || [];
  } catch (error) {
    console.error('获取场馆列表失败:', error);
    throw error;
  }
};

// 根据场馆查场地
export const getCourtsByVenue = async (venueId: number) => {
  try {
    const response = await request.get(`/api/sports/courts/venue/${venueId}`);
    return response.data || [];
  } catch (error) {
    console.error('获取场地列表失败:', error);
    throw error;
  }
};

// 查询场馆当前时段可用场地数
export const getAvailableCourts = async (venueId: number) => {
  try {
    const response = await request.get(`/api/sports/venues/${venueId}/available-courts`);
    return response.data;
  } catch (error) {
    console.error('获取可用场地数失败:', error);
    throw error;
  }
};

// 创建预约
export const createReservation = async (data: {
  userId: number;
  courtId: number;
  venueId: number;
  reserveDate: string;
  startTime: string;
  duration: number;
  endTime: string;
}) => {
  try {
    const response = await request.post('/api/sports/reservations', data);
    return response;
  } catch (error) {
    console.error('创建预约失败:', error);
    throw error;
  }
};

// 占用场地
export const occupyReservation = async (reservationId: number, userId: number) => {
  try {
    const response = await request.post(`/api/sports/reservations/${reservationId}/occupy`, {}, {
      params: { userId }
    });
    return response;
  } catch (error) {
    console.error('占用场地失败:', error);
    throw error;
  }
};

// 离开场地
export const leaveReservation = async (reservationId: number, userId: number) => {
  try {
    const response = await request.post(`/api/sports/reservations/${reservationId}/leave`, {}, {
      params: { userId }
    });
    return response;
  } catch (error) {
    console.error('离开场地失败:', error);
    throw error;
  }
};

// 查询用户预约记录
export const getUserReservations = async (userId: number) => {
  try {
    const response = await request.get(`/api/sports/reservations/user/${userId}`);
    return response.data || [];
  } catch (error) {
    console.error('获取用户预约记录失败:', error);
    throw error;
  }
};

// 查询场地当前预约
export const getCourtReservations = async (courtId: number) => {
  try {
    const response = await request.get(`/api/sports/reservations/court/${courtId}`);
    return response.data || [];
  } catch (error) {
    console.error('获取场地预约失败:', error);
    throw error;
  }
};
