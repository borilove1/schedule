// API 통신 유틸리티
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '요청 실패');
      }

      // { success: true, data: {...} } 형태면 data만 반환
      return data.success && data.data ? data.data : data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // 인증
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(data.token);
    return data;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // 일정
  async getEvents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/events${query ? `?${query}` : ''}`);
  }

  async getEvent(id) {
    const response = await this.request(`/events/${id}`);
    return response.event || response;  // event 객체만 반환
  }

  async createEvent(eventData) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id, eventData) {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(id) {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  async completeEvent(id) {
    return this.request(`/events/${id}/complete`, {
      method: 'POST',
    });
  }

  // 댓글
  async addComment(eventId, content) {
    return this.request(`/comments/events/${eventId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // 현황판
  async getDashboardStats(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/events/dashboard/stats${query ? `?${query}` : ''}`);
  }

  // 조직 구조
  async getOrganizations() {
    return this.request('/organizations/structure');
  }

  async getDivisions() {
    return this.request('/organizations/divisions');
  }

  async getDepartments() {
    return this.request('/organizations/departments');
  }
}

export const api = new ApiClient();
export default api;

// api.js에 추가할 함수들

// 일정 상세 조회
export const getEvent = async (eventId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/v1/events/${eventId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('일정 조회에 실패했습니다.');
  }

  const data = await response.json();
  return data.success ? data.data : data;
};

// 일정 수정
export const updateEvent = async (eventId, eventData) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/v1/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(eventData)
  });

  if (!response.ok) {
    throw new Error('일정 수정에 실패했습니다.');
  }

  const data = await response.json();
  return data.success ? data.data : data;
};

// 일정 삭제
export const deleteEvent = async (eventId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/v1/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('일정 삭제에 실패했습니다.');
  }

  const data = await response.json();
  return data.success ? data.data : data;
};

// 일정 완료 처리
export const completeEvent = async (eventId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/v1/events/${eventId}/complete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('완료 처리에 실패했습니다.');
  }

  const data = await response.json();
  return data.success ? data.data : data;
};

// 일정 완료 취소
export const uncompleteEvent = async (eventId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/v1/events/${eventId}/uncomplete`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('완료 취소에 실패했습니다.');
  }

  const data = await response.json();
  return data.success ? data.data : data;
};
